import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const FIGMA_API = "https://api.figma.com/v1";
const TOKEN = process.env.FIGMA_TOKEN;

async function figmaFetch(path) {
  const response = await fetch(`${FIGMA_API}${path}`, {
    headers: {
      "X-Figma-Token": TOKEN,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Figma API ${response.status}: ${text}`);
  }
  return response.json();
}

function extractLayerData(node, depth = 0) {
  if (!node || depth > 10) return null;

  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.absoluteBoundingBox) {
    info.x = Math.round(node.absoluteBoundingBox.x);
    info.y = Math.round(node.absoluteBoundingBox.y);
    info.width = Math.round(node.absoluteBoundingBox.width);
    info.height = Math.round(node.absoluteBoundingBox.height);
  }

  if (node.fills && node.fills.length > 0 && node.fills[0].type !== "NONE") {
    info.fills = node.fills.map((f) => ({
      type: f.type,
      color: f.color,
      opacity: f.opacity,
    }));
  }

  if (node.strokes && node.strokes.length > 0) {
    info.strokes = node.strokes.map((s) => ({
      type: s.type,
      color: s.color,
      weight: s.strokeWeight,
    }));
  }

  if (node.cornerRadius) info.cornerRadius = node.cornerRadius;
  if (node.opacity !== undefined && node.opacity !== 1) info.opacity = node.opacity;
  if (node.effects && node.effects.length > 0) {
    info.effects = node.effects.map((e) => ({
      type: e.type,
      visible: e.visible,
      radius: e.radius,
    }));
  }

  if (node.style) {
    info.style = {};
    if (node.style.fontFamily) info.style.fontFamily = node.style.fontFamily;
    if (node.style.fontSize) info.style.fontSize = node.style.fontSize;
    if (node.style.fontWeight) info.style.fontWeight = node.style.fontWeight;
    if (node.style.lineHeightPx) info.style.lineHeight = node.style.lineHeightPx;
    if (node.style.textAlignHorizontal) info.style.textAlign = node.style.textAlignHorizontal;
    if (node.style.letterSpacing) info.style.letterSpacing = node.style.letterSpacing;
  }

  if (node.characters) {
    info.characters = node.characters.substring(0, 200);
  }

  if (node.children && node.children.length > 0) {
    info.children = node.children
      .slice(0, 20)
      .map((child) => extractLayerData(child, depth + 1))
      .filter(Boolean);
    info.childrenCount = node.children.length;
  }

  if (node.componentId) info.componentId = node.componentId;

  return info;
}

const server = new McpServer({
  name: "figma-rest",
  version: "1.0.0",
});

server.registerTool(
  "get_figma_file",
  {
    description: "Get information about a Figma file by its URL or file key",
    inputSchema: {
      fileKey: z.string().describe("Figma file key (from URL: figma.com/file/KEY/...)"),
      depth: z.number().optional().default(3).describe("How deep to traverse (1-5)"),
    },
  },
  async ({ fileKey, depth }) => {
    try {
      const data = await figmaFetch(`/files/${fileKey}?depth=${Math.min(depth, 5)}`);

      const pages = data.document?.children?.map((page) => ({
        id: page.id,
        name: page.name,
        type: page.type,
        childCount: page.children?.length || 0,
      })) || [];

      const topFrames = data.document?.children?.flatMap(
        (page) => page.children?.filter((c) => c.type === "FRAME").map((f) => ({
          id: f.id,
          name: f.name,
          page: page.name,
          width: f.absoluteBoundingBox?.width,
          height: f.absoluteBoundingBox?.height,
        })) || []
      ) || [];

      return {
        content: [
          {
            type: "text",
            text: [
              `# Figma File: ${data.name}`,
              `Key: ${data.key}`,
              `Last Modified: ${data.lastModified}`,
              `Version: ${data.version}`,
              ``,
              `## Pages (${pages.length})`,
              pages.map((p) => `- ${p.name} (${p.id}) — ${p.childCount} children`).join("\n"),
              ``,
              `## Top Frames (${topFrames.length})`,
              topFrames.map((f) => `- "${f.name}" on "${f.page}" — ${Math.round(f.width)}×${Math.round(f.height)}`).join("\n"),
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  }
);

server.registerTool(
  "get_figma_file_nodes",
  {
    description: "Get detailed information about specific nodes/layers in a Figma file",
    inputSchema: {
      fileKey: z.string().describe("Figma file key"),
      nodeIds: z.string().describe("Comma-separated node IDs (e.g. '1:2,1:3')"),
    },
  },
  async ({ fileKey, nodeIds }) => {
    try {
      const data = await figmaFetch(`/files/${fileKey}/nodes?ids=${nodeIds}`);

      const nodes = data.nodes || {};
      const results = Object.entries(nodes).map(([id, nodeData]) => {
        if (!nodeData?.document) return `\n## Node ${id}: not found`;
        const doc = extractLayerData(nodeData.document);
        return formatNode(doc, id);
      });

      return {
        content: [
          {
            type: "text",
            text: results.join("\n---\n"),
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  }
);

server.registerTool(
  "get_figma_file_images",
  {
    description: "Get image URLs for nodes/layers in a Figma file",
    inputSchema: {
      fileKey: z.string().describe("Figma file key"),
      nodeIds: z.string().describe("Comma-separated node IDs (e.g. '1:2,1:3')"),
      format: z.enum(["png", "svg", "jpg", "pdf"]).optional().default("png"),
      scale: z.number().min(1).max(4).optional().default(2),
    },
  },
  async ({ fileKey, nodeIds, format, scale }) => {
    try {
      const data = await figmaFetch(
        `/images/${fileKey}?ids=${nodeIds}&format=${format}&scale=${scale}`
      );

      const images = data.images || {};
      const result = Object.entries(images)
        .map(([id, url]) => `- Node ${id}: ${url || "not available"}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `## Image URLs for Figma file ${fileKey}\n\n${result}\n\nImages URL are valid for 14 days.`,
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  }
);

server.registerTool(
  "get_figma_file_styles",
  {
    description: "Get styles (colors, text styles, effects) used in a Figma file",
    inputSchema: {
      fileKey: z.string().describe("Figma file key"),
    },
  },
  async ({ fileKey }) => {
    try {
      const data = await figmaFetch(`/files/${fileKey}/styles`);

      if (!data.meta?.styles || data.meta.styles.length === 0) {
        return {
          content: [{ type: "text", text: "No styles found in this file." }],
        };
      }

      const byType = {};
      for (const style of data.meta.styles) {
        const type = style.styleType || "other";
        if (!byType[type]) byType[type] = [];
        byType[type].push(`- "${style.name}" (key: ${style.key})`);
      }

      const result = Object.entries(byType)
        .map(([type, list]) => `### ${type}\n${list.join("\n")}`)
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `## Styles in Figma File\n\n${result}`,
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  }
);

server.registerTool(
  "get_figma_file_component",
  {
    description: "Get component details from a Figma file",
    inputSchema: {
      fileKey: z.string().describe("Figma file key"),
      componentId: z.string().describe("Component ID or 'all' to list all components"),
    },
  },
  async ({ fileKey, componentId }) => {
    try {
      if (componentId === "all") {
        const data = await figmaFetch(`/files/${fileKey}/components`);
        const components = data.meta?.components || [];

        if (components.length === 0) {
          return { content: [{ type: "text", text: "No components found." }] };
        }

        const list = components.map(
          (c) => `- "${c.name}" (ID: ${c.node_id}) — ${c.description || "no description"}`
        ).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `## Components\n\n${list}\n\nUse get_figma_file_nodes with node IDs for details.`,
            },
          ],
        };
      }

      const data = await figmaFetch(
        `/files/${fileKey}/nodes?ids=${componentId}`
      );

      const node = data.nodes?.[componentId]?.document;
      if (!node) {
        return { content: [{ type: "text", text: `Component "${componentId}" not found.` }] };
      }

      const formatted = formatNode(extractLayerData(node), componentId);

      return {
        content: [
          {
            type: "text",
            text: `## Component: ${node.name}\n\n${formatted}`,
          },
        ],
      };
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    }
  }
);

function formatNode(node, id) {
  if (!node) return "No data";
  let text = `### ${node.name} (${node.type})\nID: ${id}\n`;
  if (node.width) text += `Size: ${node.width}×${node.height}\n`;
  if (node.x !== undefined) text += `Position: (${node.x}, ${node.y})\n`;
  if (node.cornerRadius) text += `Corner Radius: ${node.cornerRadius}\n`;
  if (node.opacity) text += `Opacity: ${node.opacity}\n`;

  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    text += `Fill: ${fill.type}`;
    if (fill.color) text += ` rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${(fill.color.a || 1)})`;
    if (fill.opacity) text += ` (opacity: ${fill.opacity})`;
    text += "\n";
  }

  if (node.strokes && node.strokes.length > 0) {
    const s = node.strokes[0];
    text += `Stroke: ${s.type}`;
    if (s.color) text += ` rgba(${Math.round(s.color.r * 255)}, ${Math.round(s.color.g * 255)}, ${Math.round(s.color.b * 255)})`;
    if (s.weight) text += ` (${s.weight}px)`;
    text += "\n";
  }

  if (node.style) {
    text += `Font: ${node.style.fontFamily || "N/A"}, ${node.style.fontSize || "?"}px`;
    if (node.style.fontWeight) text += `, weight ${node.style.fontWeight}`;
    if (node.style.textAlign) text += `, align ${node.style.textAlign}`;
    if (node.style.lineHeight) text += `, line-height ${node.style.lineHeight}`;
    if (node.style.letterSpacing) text += `, letter-spacing ${node.style.letterSpacing}`;
    text += "\n";
  }

  if (node.characters) {
    text += `Text: "${node.characters}"\n`;
  }

  if (node.childrenCount !== undefined) {
    text += `Children: ${node.childrenCount}\n`;
  }

  if (node.componentId) {
    text += `Component Instance: ${node.componentId}\n`;
  }

  if (node.children && node.children.length > 0) {
    text += `\n**Layers:**\n`;
    for (const child of node.children) {
      text += `- ${child.name} (${child.type})${child.width ? ` ${child.width}×${child.height}` : ""}${child.characters ? `: "${child.characters.substring(0, 80)}"` : ""}\n`;
    }
  }

  if (node.effects && node.effects.length > 0) {
    text += `\nEffects: ${node.effects.map((e) => `${e.type}${e.visible ? "" : " (hidden)"}`).join(", ")}\n`;
  }

  return text;
}

const transport = new StdioServerTransport();
await server.connect(transport);

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";

const BASE_URL = "https://vuejs.org";

const DOC_SECTIONS = [
  { id: "guide/introduction", title: "Introduction" },
  { id: "guide/quick-start", title: "Quick Start" },
  { id: "guide/essentials/application", title: "Creating an Application" },
  { id: "guide/essentials/template-syntax", title: "Template Syntax" },
  { id: "guide/essentials/reactivity-fundamentals", title: "Reactivity Fundamentals" },
  { id: "guide/essentials/computed", title: "Computed Properties" },
  { id: "guide/essentials/class-and-style", title: "Class and Style Bindings" },
  { id: "guide/essentials/conditional", title: "Conditional Rendering" },
  { id: "guide/essentials/list", title: "List Rendering" },
  { id: "guide/essentials/event-handling", title: "Event Handling" },
  { id: "guide/essentials/forms", title: "Form Input Bindings" },
  { id: "guide/essentials/lifecycle", title: "Lifecycle Hooks" },
  { id: "guide/essentials/watchers", title: "Watchers" },
  { id: "guide/essentials/template-refs", title: "Template Refs" },
  { id: "guide/essentials/component-basics", title: "Component Basics" },
  { id: "guide/components/registration", title: "Component Registration" },
  { id: "guide/components/props", title: "Props" },
  { id: "guide/components/events", title: "Events" },
  { id: "guide/components/slots", title: "Slots" },
  { id: "guide/components/provide-inject", title: "Provide / Inject" },
  { id: "guide/reusability/composables", title: "Composables" },
  { id: "guide/reusability/plugins", title: "Plugins" },
  { id: "guide/reusability/custom-directives", title: "Custom Directives" },
  { id: "guide/built-ins/teleport", title: "Teleport" },
  { id: "guide/built-ins/suspense", title: "Suspense" },
  { id: "guide/scaling-up/sfc", title: "Single-File Components" },
  { id: "guide/scaling-up/routing", title: "Routing" },
  { id: "guide/scaling-up/state-management", title: "State Management" },
  { id: "guide/typescript/overview", title: "TypeScript with Vue" },
  { id: "guide/typescript/composition-api", title: "TypeScript + Composition API" },
  { id: "guide/best-practices/performance", title: "Performance" },
  { id: "guide/best-practices/accessibility", title: "Accessibility" },
  { id: "guide/best-practices/production-deployment", title: "Production Deployment" },
  { id: "api/reactivity-core", title: "Reactivity API: Core" },
  { id: "api/reactivity-utilities", title: "Reactivity API: Utilities" },
  { id: "api/composition-api-setup", title: "Composition API: setup()" },
  { id: "api/composition-api-lifecycle", title: "Composition API: Lifecycle" },
  { id: "api/composition-api-dependency-injection", title: "Composition API: Dependency Injection" },
  { id: "api/general", title: "Global API" },
  { id: "api/application", title: "Application API" },
  { id: "api/built-in-directives", title: "Built-in Directives" },
  { id: "api/built-in-components", title: "Built-in Components" },
  { id: "api/sfc-spec", title: "SFC Syntax Specification" },
  { id: "api/sfc-script-setup", title: "SFC script setup" },
  { id: "api/sfc-css-features", title: "SFC CSS Features" },
  { id: "api/options-state", title: "Options API: State" },
  { id: "api/options-lifecycle", title: "Options API: Lifecycle" },
  { id: "api/options-misc", title: "Options API: Miscellaneous" },
  { id: "api/component-instance", title: "Component Instance" },
];

function extractContent(html, topic) {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const contentStart = lines.findIndex(
    (l) => l.toLowerCase().includes(topic.toLowerCase()) || l.match(/^#|introduction|getting started/i)
  );

  const startIdx = contentStart > 0 ? contentStart : 0;
  const relevant = lines.slice(startIdx, startIdx + 200);

  if (relevant.length === 0) return lines.slice(0, 200).join("\n");
  return relevant.join("\n");
}

async function fetchVuePage(path) {
  const urls = [
    `${BASE_URL}/${path}.html`,
    `${BASE_URL}/api/${path}.html`,
  ];

  for (const url of urls) {
    const response = await fetch(url);
    if (response.ok) {
      const html = await response.text();
      return { html, url };
    }
  }
  return null;
}

const server = new McpServer({
  name: "vue-docs",
  version: "1.0.0",
});

server.registerTool(
  "vue_list_sections",
  {
    description: "List available Vue 3 documentation sections",
    inputSchema: {},
  },
  async () => {
    const list = DOC_SECTIONS.map((s) => `- ${s.id} — ${s.title}`).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Available Vue 3 Documentation Sections:\n\n${list}\n\nUse vue_get_page with a section ID or keyword to read the content.`,
        },
      ],
    };
  }
);

server.registerTool(
  "vue_get_page",
  {
    description: "Get a Vue 3 documentation page by section ID or topic keyword",
    inputSchema: {
      topic: z.string().describe("Section ID or topic, e.g. 'reactivity-fundamentals', 'components/props', 'computed'"),
    },
  },
  async ({ topic }) => {
    const section = DOC_SECTIONS.find(
      (s) => s.id.includes(topic) || s.title.toLowerCase().includes(topic.toLowerCase())
    );

    const path = section ? section.id : topic;
    const result = await fetchVuePage(path);

    if (!result) {
      return {
        content: [
          {
            type: "text",
            text: `Section "${topic}" not found. Use vue_list_sections to see available sections.`,
          },
        ],
      };
    }

    const text = extractContent(result.html, topic);

    return {
      content: [
        {
          type: "text",
          text: `# Vue 3 Documentation: ${section?.title || topic}\nSource: ${result.url}\n\n${text}`,
        },
      ],
    };
  }
);

server.registerTool(
  "vue_search",
  {
    description: "Search Vue 3 documentation sections by keyword",
    inputSchema: {
      query: z.string().describe("Search query, e.g. 'computed', 'ref', 'slot', 'provide'"),
    },
  },
  async ({ query }) => {
    const matches = DOC_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase())
    );

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No sections found for "${query}". Try vue_get_page with a specific topic to search within page content.`,
          },
        ],
      };
    }

    const result = matches.map((s) => `- ${s.id} → ${s.title}`).join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Found sections matching "${query}":\n\n${result}\n\nUse vue_get_page with a section ID to read the full content.`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

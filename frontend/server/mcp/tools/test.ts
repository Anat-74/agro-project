import { z } from "zod";

export default defineMcpTool({
  name: "test",
  description: "A simple test tool to verify MCP setup",
  inputSchema: {
    message: z.string().describe("The message to echo back"),
  },
  handler: async ({ message }) => {
    return {
      content: [
        {
          type: "text",
          text: `Test successful: ${message}`,
        },
      ],
    };
  },
});

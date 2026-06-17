import { WebSearch, fetchUrl } from "./utils.js";

export const WebSearchTool = {
  functionDeclarations: [
    {
      name: "WebSearch",
      description:
        "Search the Web about the relevant Information about the given topic",
      parameters: {
        type: "OBJECT",
        properties: {
          Topic: {
            type: "STRING",
            description: "Enter the topic you want to find relevant info about",
          },
        },
        required: ["Topic"],
      },
    },
    {
      name: "fetchUrl",
      description:
        "Fetch the full content of a webpage URL. Use this after WebSearch to read the full article from a specific URL",
      parameters: {
        type: "OBJECT",
        properties: {
          url: {
            type: "STRING",
            description: "Fetch the necessary information",
          },
        },
        required: ["url"],
      },
    },
  ],
};
export const availableTools = {
  WebSearch: WebSearch,
  fetchUrl: fetchUrl,
};

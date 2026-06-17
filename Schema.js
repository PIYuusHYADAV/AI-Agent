export const validationSchema = {
  title: "string",
  properties: {
    isTechRelated: { type: "boolean" },
  },
};
export const reportSchema = {
  title: "string",
  generatedAt: "ISO date string",
  topic: "string",
  summary: "string",

  sections: [
    {
      heading: "string",
      content: "string",
      keyPoints: ["string"],
      sources: [
        {
          title: "string",
          url: "string",
        },
      ],
    },
  ],

  techStack: ["string"],

  keyFacts: ["string"],

  useCases: ["string"],

  limitations: ["string"],

  futureOutlook: "string",

  allSources: [
    {
      title: "string",
      url: "string",
    },
  ],
};

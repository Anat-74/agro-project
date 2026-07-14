import { defineEventHandler, getQuery } from "h3";
import { $fetch } from "ofetch";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const locale = query.locale || "ru";
    const { strapi: { url: strapiUrl } } = useRuntimeConfig(event);
    const response = await $fetch(`${strapiUrl}/api/ai-assistant`, {
      params: { populate: "*", locale },
    });

    const data = response.data as AiAssistant;
    return {
      suggestions: data.quickSuggestions || [],
      welcomeTitle: data.welcomeTitle || "",
      welcomeDescription: data.welcomeDescription || "",
    } satisfies ChatSuggestionsData;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return {
      suggestions: [],
      welcomeTitle: "",
      welcomeDescription: "",
    } satisfies ChatSuggestionsData;
  }
});

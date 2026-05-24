import { defineEventHandler, getQuery } from "h3";
import { $fetch } from "ofetch";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const locale = query.locale || "ru";
    const strapiUrl = process.env.STRAPI_URL || "http://127.0.0.1:1337";
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

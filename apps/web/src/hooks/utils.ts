import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";

export const createClient = () => {
  // Use relative URL for client-side requests (browser)
  // This ensures requests go through Next.js API proxy at /api/[...path]
  const isClient = typeof window !== "undefined";
  
  let apiUrl: string;
  if (isClient) {
    // In browser: construct full URL using current origin + /api
    apiUrl = `${window.location.origin}/api`;
  } else {
    // On server: use environment variable (e.g., http://agents:54367)
    apiUrl = LANGGRAPH_API_URL;
  }
  
  return new Client({
    apiUrl,
  });
};

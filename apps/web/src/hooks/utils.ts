import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";

export const createClient = () => {
  // Use relative URL for client-side requests (browser)
  // This ensures requests go through Next.js API proxy at /api/[...path]
  const isClient = typeof window !== "undefined";
  const apiUrl = isClient ? "/api" : LANGGRAPH_API_URL;
  
  return new Client({
    apiUrl,
  });
};

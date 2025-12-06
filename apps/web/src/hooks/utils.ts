import { Client } from "@langchain/langgraph-sdk";
import { LANGGRAPH_API_URL } from "@/constants";

export const createClient = () => {
  return new Client({
    apiUrl: LANGGRAPH_API_URL,
  });
};

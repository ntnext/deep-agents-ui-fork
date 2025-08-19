import { Client } from "@langchain/langgraph-sdk";

export function createClient(apiUrl: string, apiKey: string) {
  return new Client({
    apiUrl: apiUrl,
    apiKey: apiKey,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
}

export function createOptimizerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || "",
    process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "",
  );
}

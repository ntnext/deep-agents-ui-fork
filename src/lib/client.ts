import { Client } from "@langchain/langgraph-sdk";
import { getDeployment, getOptimizationDeployment } from "./environment/deployments";

export function createClient(accessToken: string, ) {
  const deployment = getDeployment();
  return new Client({
    apiUrl: deployment?.deploymentUrl || "",
    apiKey: accessToken,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
}

export function createOptimizerClient() {
  const deployment = getOptimizationDeployment();
  // Use environment variable for optimizer client
  const optimizerApiKey = process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "";
  return new Client({
    apiUrl: deployment?.deploymentUrl || "",
    apiKey: optimizerApiKey,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
}
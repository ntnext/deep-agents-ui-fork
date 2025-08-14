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

export function createOptimizerClient(accessToken: string) {
  const deployment = getOptimizationDeployment();
  return new Client({
    apiUrl: deployment?.deploymentUrl || "",
    apiKey: accessToken,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });
}
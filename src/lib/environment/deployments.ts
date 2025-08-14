export function getDeployment() {
  return {
    name: "Deep Agent",
    deploymentUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "http://127.0.0.1:2024",
    agentId: process.env.NEXT_PUBLIC_AGENT_ID || "deepagent",
    assistantId: process.env.NEXT_PUBLIC_ASSISTANT_ID,
  };
}

export function getOptimizationDeployment() {
  return {
    name: "Optimizer",
    deploymentUrl: process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || "",
    agentId: process.env.NEXT_PUBLIC_OPTIMIZATION_AGENT_ID || "optimizer",
  }
}
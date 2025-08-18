function getEnvValue(key: string): string | undefined {
  if (typeof window !== "undefined") {
    const storedValue = localStorage.getItem(key);
    if (storedValue) return storedValue;
  }
  return process.env[key];
}

export function getDeployment() {
  return {
    name: "Deep Agent",
    deploymentUrl: getEnvValue("DEPLOYMENT_URL"),
    agentId: getEnvValue("AGENT_ID"),
    assistantId: getEnvValue("ASSISTANT_ID"),
  };
}

export function getOptimizationDeployment() {
  return {
    name: "Optimizer",
    deploymentUrl: process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || "",
    agentId: process.env.NEXT_PUBLIC_OPTIMIZER_AGENT_ID || "optimizer",
  };
}

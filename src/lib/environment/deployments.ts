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
    deploymentUrl: getEnvValue("NEXT_PUBLIC_DEPLOYMENT_URL"),
    agentId: getEnvValue("NEXT_PUBLIC_AGENT_ID"),
    assistantId: getEnvValue("NEXT_PUBLIC_ASSISTANT_ID"),
  };
}

export function getOptimizationDeployment() {
  return {
    name: "Optimizer",
    deploymentUrl: process.env.NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL || "",
    agentId: process.env.NEXT_PUBLIC_OPTIMIZER_AGENT_ID || "optimizer",
  };
}

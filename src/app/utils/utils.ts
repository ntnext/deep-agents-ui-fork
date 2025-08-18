import { Message } from "@langchain/langgraph-sdk";

export function extractStringFromMessageContent(message: Message): string {
  return typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content
          .filter((c: any) => c.type === "text" || typeof c === "string")
          .map((c: any) => (typeof c === "string" ? c : c.text || ""))
          .join("")
      : "";
}

export function isPreparingToCallTaskTool(messages: Message[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage.type === "ai" && lastMessage.tool_calls?.some((call: any) => call.name === "task") || false;
}

export function justCalledTaskTool(messages: Message[]): boolean {
  const lastAiMessage = messages.findLast((message) => message.type === "ai");
  if (!lastAiMessage) return false;
  const toolMessagesAfterLastAiMessage = messages.slice(messages.indexOf(lastAiMessage) + 1);
  const taskToolCallsCompleted = toolMessagesAfterLastAiMessage.some((message) => message.type === "tool" && message.name === "task");
  return lastAiMessage.tool_calls?.some((call: any) => call.name === "task") && taskToolCallsCompleted || false;
} 
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

export function assembleOptimizerInputMessage(currentConfig: any, feedback: string, messages: Message[]) {
  const messageContent = `
  <current_config>
    ${JSON.stringify(currentConfig, null, 2)}
  </current_config>
  
  <feedback>
    ${feedback}
  </feedback>
  
  <conversation_history>
    ${messages.map((message, index) => {
      const content = typeof message.content === "string" 
        ? message.content 
        : Array.isArray(message.content)
          ? message.content.map(c => 
              typeof c === "string" ? c : 
              (c as any).type === "text" ? (c as any).text : 
              (c as any).type === "tool_use" ? `[Tool Use: ${(c as any).name || 'unknown'}]` :
              JSON.stringify(c)
            ).join("")
          : JSON.stringify(message.content);
      
      return `<message id="${message.id || index}" type="${message.type}">
        <content>${content}</content>
        ${message.name ? `<name>${message.name}</name>` : ""}
        ${(message as any).tool_calls ? `<tool_calls>${JSON.stringify((message as any).tool_calls, null, 2)}</tool_calls>` : ""}
        ${(message as any).response_metadata ? `<response_metadata>${JSON.stringify((message as any).response_metadata, null, 2)}</response_metadata>` : ""}
        ${(message as any).usage_metadata ? `<usage_metadata>${JSON.stringify((message as any).usage_metadata, null, 2)}</usage_metadata>` : ""}
      </message>`;
    }).join("\n    ")}
  </conversation_history>`;
  return messageContent;
}
import { useCallback, useMemo } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  type Message,
  type Assistant,
  type Checkpoint,
} from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import type { TodoItem } from "../types/types";
import { createClient } from "@/lib/client";
import { ENV_CONFIG_KEYS, useEnvConfig } from "@/providers/EnvConfig";

type StateType = {
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
};

export function useChat(
  threadId: string | null,
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
  ) => void,
  onTodosUpdate: (todos: TodoItem[]) => void,
  onFilesUpdate: (files: Record<string, string>) => void,
  activeAssistant: Assistant | null,
) {
  const { getEnvValue, getLangSmithApiKey } = useEnvConfig();
  const deploymentUrl = useMemo(
    () => getEnvValue(ENV_CONFIG_KEYS.DEPLOYMENT_URL),
    [getEnvValue],
  );
  const langsmithApiKey = useMemo(
    () => getLangSmithApiKey(),
    [getLangSmithApiKey],
  );

  const handleUpdateEvent = useCallback(
    (data: { [node: string]: Partial<StateType> }) => {
      Object.values(data).forEach((nodeData) => {
        if (nodeData?.todos) {
          onTodosUpdate(nodeData.todos);
        }
        if (nodeData?.files) {
          onFilesUpdate(nodeData.files);
        }
      });
    },
    [onTodosUpdate, onFilesUpdate],
  );

  const stream = useStream<StateType>({
    assistantId:
      activeAssistant?.assistant_id ||
      getEnvValue(ENV_CONFIG_KEYS.ASSISTANT_ID) ||
      getEnvValue(ENV_CONFIG_KEYS.AGENT_ID) ||
      "",
    client: createClient(deploymentUrl || "", langsmithApiKey),
    reconnectOnMount: true,
    threadId: threadId ?? null,
    onUpdateEvent: handleUpdateEvent,
    onThreadId: setThreadId,
    defaultHeaders: {
      "x-auth-scheme": "langsmith",
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      const humanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: message,
      };
      stream.submit(
        { messages: [humanMessage] },
        {
          optimisticValues(prev) {
            const prevMessages = prev.messages ?? [];
            const newMessages = [...prevMessages, humanMessage];
            return { ...prev, messages: newMessages };
          },
          config: {
            ...(activeAssistant?.config || {}),
            recursion_limit: 100,
          },
        },
      );
    },
    [stream, activeAssistant?.config],
  );

  const runSingleStep = useCallback(
    (
      messages: Message[],
      checkpoint?: Checkpoint,
      isRerunningSubagent?: boolean,
    ) => {
      if (checkpoint) {
        stream.submit(undefined, {
          config: {
            ...(activeAssistant?.config || {}),
          },
          checkpoint: checkpoint,
          ...(isRerunningSubagent
            ? { interruptAfter: ["tools"] }
            : { interruptBefore: ["tools"] }),
        });
      } else {
        stream.submit(
          { messages: messages },
          {
            config: {
              ...(activeAssistant?.config || {}),
            },
            interruptBefore: ["tools"],
          },
        );
      }
    },
    [stream, activeAssistant?.config],
  );

  const continueStream = useCallback(
    (hasTaskToolCall?: boolean) => {
      stream.submit(undefined, {
        config: {
          ...(activeAssistant?.config || {}),
          recursion_limit: 100,
        },
        ...(hasTaskToolCall
          ? { interruptAfter: ["tools"] }
          : { interruptBefore: ["tools"] }),
      });
    },
    [stream, activeAssistant?.config],
  );

  const stopStream = useCallback(() => {
    stream.stop();
  }, [stream]);

  return {
    messages: stream.messages,
    isLoading: stream.isLoading,
    interrupt: stream.interrupt,
    getMessagesMetadata: stream.getMessagesMetadata,
    sendMessage,
    runSingleStep,
    continueStream,
    stopStream,
  };
}

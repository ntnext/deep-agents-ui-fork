"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { ChatInterface } from "./components/ChatInterface/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar/TasksFilesSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel/SubAgentPanel";
import { FileViewDialog } from "./components/FileViewDialog/FileViewDialog";
import { createClient } from "@/lib/client";
import { useEnvConfig, ENV_CONFIG_KEYS } from "@/providers/EnvConfig";
import type { SubAgent, FileItem, TodoItem } from "./types/types";
import styles from "./page.module.scss";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChat } from "./hooks/useChat";

export default function HomePage() {
  const { getEnvValue, getLangSmithApiKey } = useEnvConfig();
  const [threadId, setThreadId] = useQueryState("threadId");
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [debugMode, setDebugMode] = useState(false);
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);

  const deploymentUrl = useMemo(
    () => getEnvValue(ENV_CONFIG_KEYS.DEPLOYMENT_URL),
    [getEnvValue],
  );
  const langsmithApiKey = useMemo(
    () => getLangSmithApiKey(),
    [getLangSmithApiKey],
  );
  const client = useMemo(() => {
    return createClient(deploymentUrl || "", langsmithApiKey);
  }, [deploymentUrl, langsmithApiKey]);

  const refreshActiveAssistant = useCallback(async () => {
    try {
      const assistantId = getEnvValue(ENV_CONFIG_KEYS.ASSISTANT_ID);
      if (!assistantId) {
        console.error("Assistant ID not configured");
        return;
      }
      const assistant = await client.assistants.get(assistantId);
      setActiveAssistant(assistant);
    } catch (error) {
      console.error("Failed to refresh assistant:", error);
    }
  }, [client, getEnvValue]);

  useEffect(() => {
    refreshActiveAssistant();
  }, [refreshActiveAssistant]);

  // When the threadId changes, grab the thread state from the graph server
  useEffect(() => {
    const fetchThreadState = async () => {
      // TODO: Potentially remove the langsmithApiKey check
      if (!threadId || !langsmithApiKey) {
        setTodos([]);
        setFiles({});
        setIsLoadingThreadState(false);
        return;
      }
      setIsLoadingThreadState(true);
      try {
        const state = await client.threads.getState(threadId);
        if (state.values) {
          const currentState = state.values as {
            todos?: TodoItem[];
            files?: Record<string, string>;
          };
          setTodos(currentState.todos || []);
          setFiles(currentState.files || {});
        }
      } catch (error) {
        console.error("Failed to fetch thread state:", error);
        setTodos([]);
        setFiles({});
      } finally {
        setIsLoadingThreadState(false);
      }
    };
    fetchThreadState();
  }, [threadId, client, langsmithApiKey]);

  const handleNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

  const {
    messages,
    isLoading,
    interrupt,
    getMessagesMetadata,
    sendMessage,
    runSingleStep,
    continueStream,
    stopStream,
  } = useChat(threadId, setThreadId, setTodos, setFiles, activeAssistant);

  return (
    <div className={styles.container}>
      <TasksFilesSidebar
        messages={messages}
        todos={todos}
        files={files}
        activeAssistant={activeAssistant}
        onFileClick={setSelectedFile}
        onAssistantUpdate={refreshActiveAssistant}
      />
      <div className={styles.mainContent}>
        <ChatInterface
          threadId={threadId}
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          stopStream={stopStream}
          getMessagesMetadata={getMessagesMetadata}
          selectedSubAgent={selectedSubAgent}
          setThreadId={setThreadId}
          onSelectSubAgent={setSelectedSubAgent}
          onNewThread={handleNewThread}
          isLoadingThreadState={isLoadingThreadState}
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          runSingleStep={runSingleStep}
          continueStream={continueStream}
          interrupt={interrupt}
        />
        {selectedSubAgent && (
          <SubAgentPanel
            subAgent={selectedSubAgent}
            onClose={() => setSelectedSubAgent(null)}
          />
        )}
      </div>
      {selectedFile && (
        <FileViewDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}

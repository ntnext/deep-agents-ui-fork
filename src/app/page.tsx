"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { ChatInterface } from "./components/ChatInterface/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar/TasksFilesSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel/SubAgentPanel";
import { FileViewDialog } from "./components/FileViewDialog/FileViewDialog";
import { createClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import type { SubAgent, FileItem, TodoItem } from "./types/types";
import styles from "./page.module.scss";
import { Assistant } from "@langchain/langgraph-sdk";
import { useChat } from "./hooks/useChat";

export default function HomePage() {
  const { session } = useAuthContext();
  const [threadId, setThreadId] = useQueryState("threadId");
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [activeAssistant, setActiveAssistant] = useState<Assistant | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const client = useMemo(() => {
    return createClient(session?.accessToken || "");
  }, [session?.accessToken]);

  const refreshActiveAssistant = useCallback(async () => {
    try {
      const assistant = await client.assistants.get(process.env.NEXT_PUBLIC_ASSISTANT_ID || "");
      console.log("Triggered assistant update", assistant);
      setActiveAssistant(assistant);
    } catch (error) {
      console.error("Failed to refresh assistant:", error);
    }
  }, [client]);

  useEffect(() => {
    refreshActiveAssistant();
  }, [refreshActiveAssistant]);

  // When the threadId changes, grab the thread state from the graph server
  useEffect(() => {
    const fetchThreadState = async () => {
      if (!threadId || !session?.accessToken) {
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
  }, [threadId, client]);

  const handleNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

  const { messages, isLoading, sendMessage, stopStream } = useChat(
    threadId,
    setThreadId,
    setTodos,
    setFiles,
  );

  return (
    <div className={styles.container}>
      <TasksFilesSidebar
        messages={messages}
        todos={todos}
        files={files}
        activeAssistant={activeAssistant}
        onFileClick={setSelectedFile}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        onAssistantUpdate={refreshActiveAssistant}
      />
      <div className={styles.mainContent}>
        <ChatInterface
          threadId={threadId}
          messages={messages}
          isLoading={isLoading}
          sendMessage={sendMessage}
          stopStream={stopStream}
          selectedSubAgent={selectedSubAgent}
          setThreadId={setThreadId}
          onSelectSubAgent={setSelectedSubAgent}
          onNewThread={handleNewThread}
          isLoadingThreadState={isLoadingThreadState}
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

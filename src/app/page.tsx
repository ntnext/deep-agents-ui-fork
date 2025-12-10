"use client";

import { Suspense } from 'react';
import React, { useState, useCallback, useEffect } from "react";
import { useQueryState } from "nuqs";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "./components/ChatInterface/ChatInterface";
import { TasksFilesSidebar } from "./components/TasksFilesSidebar/TasksFilesSidebar";
import { SubAgentPanel } from "./components/SubAgentPanel/SubAgentPanel";
import { FileViewDialog } from "./components/FileViewDialog/FileViewDialog";
import { UserMenu } from "@/components/UserMenu";
import { createClient } from "@/lib/client";
import type { SubAgent, FileItem, TodoItem } from "./types/types";
import styles from "./page.module.scss";

export const dynamic = 'force-dynamic'; // ← evita il prerender su "/"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [threadId, setThreadId] = useQueryState("threadId");
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingThreadState, setIsLoadingThreadState] = useState(false);

  // Redirect se non autenticato
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // When the threadId changes, grab the thread state from the graph server
  useEffect(() => {
    const fetchThreadState = async () => {
      if (!threadId || !session?.user) {
        setTodos([]);
        setFiles({});
        setIsLoadingThreadState(false);
        return;
      }
      setIsLoadingThreadState(true);
      try {
        const client = createClient(process.env.NEXT_PUBLIC_LANGSMITH_API_KEY || "");
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
  }, [threadId, session?.user]);

  const handleNewThread = useCallback(() => {
    setThreadId(null);
    setSelectedSubAgent(null);
    setTodos([]);
    setFiles({});
  }, [setThreadId]);

  if (status === "loading") {
    return <div>Caricamento...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <TasksFilesSidebar
        todos={todos}
        files={files}
        onFileClick={setSelectedFile}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div className={styles.mainContent}>
        <ChatInterface
          threadId={threadId}
          selectedSubAgent={selectedSubAgent}
          setThreadId={setThreadId}
          onSelectSubAgent={setSelectedSubAgent}
          onTodosUpdate={setTodos}
          onFilesUpdate={setFiles}
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

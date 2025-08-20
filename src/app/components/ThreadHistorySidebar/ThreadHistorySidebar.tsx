"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { createClient } from "@/lib/client";
import { useEnvConfig } from "@/providers/EnvConfig";
import type { Thread } from "../../types/types";
import { cn } from "@/lib/utils";
import { extractStringFromMessageContent } from "../../utils/utils";
import { Message } from "@langchain/langgraph-sdk";

interface ThreadHistorySidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

export const ThreadHistorySidebar = React.memo<ThreadHistorySidebarProps>(
  ({ open, setOpen, currentThreadId, onThreadSelect }) => {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoadingThreadHistory, setIsLoadingThreadHistory] = useState(true);
    const { config } = useEnvConfig();
    const deploymentUrl = config?.DEPLOYMENT_URL || "";
    const langsmithApiKey = config?.LANGSMITH_API_KEY || "filler-token";
    const client = useMemo(
      () => createClient(deploymentUrl, langsmithApiKey),
      [deploymentUrl, langsmithApiKey],
    );

    const fetchThreads = useCallback(async () => {
      if (!deploymentUrl || !langsmithApiKey) return;
      setIsLoadingThreadHistory(true);
      try {
        const response = await client.threads.search({
          limit: 30,
          sortBy: "created_at",
          sortOrder: "desc",
        });
        const threadList: Thread[] = response.map(
          (thread: {
            thread_id: string;
            values?: unknown;
            created_at: string;
            updated_at?: string;
            status?: string;
          }) => {
            let displayContent =
              thread.status === "busy"
                ? "Current Thread"
                : `Thread ${thread.thread_id.slice(0, 8)}`;
            try {
              if (
                thread.values &&
                typeof thread.values === "object" &&
                "messages" in thread.values
              ) {
                const messages = (thread.values as { messages?: unknown[] })
                  .messages;
                if (
                  Array.isArray(messages) &&
                  messages.length > 0 &&
                  thread.status !== "busy"
                ) {
                  displayContent = extractStringFromMessageContent(
                    messages[0] as Message,
                  );
                }
              }
            } catch (error) {
              console.warn(
                `Failed to get first message for thread ${thread.thread_id}:`,
                error,
              );
            }
            return {
              id: thread.thread_id,
              title: displayContent,
              createdAt: new Date(thread.created_at),
              updatedAt: new Date(thread.updated_at || thread.created_at),
            } as Thread;
          },
        );
        setThreads(
          threadList.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
          ),
        );
      } catch (error) {
        console.error("Failed to fetch threads:", error);
      } finally {
        setIsLoadingThreadHistory(false);
      }
    }, [client, deploymentUrl, langsmithApiKey]);

    useEffect(() => {
      fetchThreads();
    }, [fetchThreads, currentThreadId]);

    const groupedThreads = useMemo(() => {
      const groups: Record<string, Thread[]> = {
        today: [],
        yesterday: [],
        week: [],
        older: [],
      };
      const now = new Date();
      threads.forEach((thread) => {
        const diff = now.getTime() - thread.updatedAt.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) groups.today.push(thread);
        else if (days === 1) groups.yesterday.push(thread);
        else if (days < 7) groups.week.push(thread);
        else groups.older.push(thread);
      });
      return groups;
    }, [threads]);

    if (!open) return null;

    return (
      <div className="fixed top-0 right-0 h-screen w-[20vw] z-50 animate-[slideIn_300ms_ease-out]">
        <div className="h-full flex flex-col bg-[var(--color-background)] border-l border-[var(--color-border)] shadow-xl">
          <div className="flex justify-between items-center p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <h3 className="text-base font-semibold m-0">Thread History</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-[var(--color-border-light)]"
              >
                <X size={20} />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 overflow-y-auto">
            {isLoadingThreadHistory ? (
              <div className="flex flex-col items-center justify-center p-16 text-[var(--color-text-tertiary)] text-center">Loading threads...</div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-[var(--color-text-tertiary)] text-center">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p>No threads yet</p>
              </div>
            ) : (
              <div className="p-2">
                {groupedThreads.today.length > 0 && (
                  <div className="mb-6 last:mb-0">
                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider p-2 m-0">Today</h4>
                    {groupedThreads.today.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => onThreadSelect(thread.id)}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.yesterday.length > 0 && (
                  <div className="mb-6 last:mb-0">
                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider p-2 m-0">Yesterday</h4>
                    {groupedThreads.yesterday.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => onThreadSelect(thread.id)}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.week.length > 0 && (
                  <div className="mb-6 last:mb-0">
                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider p-2 m-0">This Week</h4>
                    {groupedThreads.week.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => onThreadSelect(thread.id)}
                      />
                    ))}
                  </div>
                )}
                {groupedThreads.older.length > 0 && (
                  <div className="mb-6 last:mb-0">
                    <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider p-2 m-0">Older</h4>
                    {groupedThreads.older.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => onThreadSelect(thread.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    );
  },
);

const ThreadItem = React.memo<{
  thread: Thread;
  isActive: boolean;
  onClick: () => void;
}>(({ thread, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-2 w-full p-2 bg-transparent border-none rounded-md text-left cursor-pointer transition-colors duration-200 hover:bg-[var(--color-border-light)]",
        isActive && "bg-[var(--color-avatar-bg)] [&_.thread-icon]:text-[var(--color-primary)] [&_.thread-title]:text-[var(--color-primary)]"
      )}
    >
      <MessageSquare className="thread-icon w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="thread-title text-sm font-medium text-[var(--color-text-primary)] mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{thread.title}</div>
      </div>
    </button>
  );
});

ThreadItem.displayName = "ThreadItem";
ThreadHistorySidebar.displayName = "ThreadHistorySidebar";






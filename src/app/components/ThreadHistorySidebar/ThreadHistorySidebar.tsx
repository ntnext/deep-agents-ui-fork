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
      <div className="fixed top-0 right-0 z-50 h-screen w-[20vw] animate-[slideIn_300ms_ease-out]">
        <div className="flex h-full flex-col border-l border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="m-0 text-base font-semibold">Thread History</h3>
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
              <div className="flex flex-col items-center justify-center p-16 text-center text-[var(--color-text-tertiary)]">
                Loading threads...
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center text-[var(--color-text-tertiary)]">
                <MessageSquare className="mb-2 h-8 w-8 opacity-50" />
                <p>No threads yet</p>
              </div>
            ) : (
              <div className="p-2">
                {groupedThreads.today.length > 0 && (
                  <div className="mb-6 last:mb-0">
                    <h4 className="m-0 p-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                      Today
                    </h4>
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
                    <h4 className="m-0 p-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                      Yesterday
                    </h4>
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
                    <h4 className="m-0 p-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                      This Week
                    </h4>
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
                    <h4 className="m-0 p-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                      Older
                    </h4>
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
        "flex w-full cursor-pointer items-start gap-2 rounded-md border-none bg-transparent p-2 text-left transition-colors duration-200 hover:bg-[var(--color-border-light)]",
        isActive &&
          "bg-[var(--color-avatar-bg)] [&_.thread-icon]:text-[var(--color-primary)] [&_.thread-title]:text-[var(--color-primary)]",
      )}
    >
      <MessageSquare className="thread-icon mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-secondary)]" />
      <div className="min-w-0 flex-1">
        <div className="thread-title mb-1 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-[var(--color-text-primary)]">
          {thread.title}
        </div>
      </div>
    </button>
  );
});

ThreadItem.displayName = "ThreadItem";
ThreadHistorySidebar.displayName = "ThreadHistorySidebar";

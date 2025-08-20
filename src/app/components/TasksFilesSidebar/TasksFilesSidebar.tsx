"use client";

import React, { useMemo, useCallback, useState } from "react";
import { FileText, CheckCircle, Circle, Clock, Settings } from "lucide-react";
import { useEnvConfig } from "@/providers/EnvConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { OptimizationWindow } from "../OptimizationWindow/OptimizationWindow";
import type { TodoItem, FileItem } from "../../types/types";
import { cn } from "@/lib/utils";
import { Assistant, Message } from "@langchain/langgraph-sdk";

interface TasksFilesSidebarProps {
  threadId: string | null;
  messages: Message[];
  todos: TodoItem[];
  files: Record<string, string>;
  activeAssistant: Assistant | null;
  onFileClick: (file: FileItem) => void;
  onAssistantUpdate: () => void;
  assistantError: string | null;
}

export const TasksFilesSidebar = React.memo<TasksFilesSidebarProps>(
  ({
    threadId,
    messages,
    todos,
    files,
    activeAssistant,
    onFileClick,
    onAssistantUpdate,
    assistantError,
  }) => {
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(false);
    const { openSettings } = useEnvConfig();

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

    const getStatusIcon = useCallback((status: TodoItem["status"]) => {
      switch (status) {
        case "completed":
          return (
            <CheckCircle
              size={16}
              className={styles.completedIcon}
            />
          );
        case "in_progress":
          return (
            <Clock
              size={16}
              className={styles.progressIcon}
            />
          );
        default:
          return (
            <Circle
              size={16}
              className={styles.pendingIcon}
            />
          );
      }
    }, []);

    const groupedTodos = useMemo(() => {
      return {
        pending: todos.filter((t) => t.status === "pending"),
        in_progress: todos.filter((t) => t.status === "in_progress"),
        completed: todos.filter((t) => t.status === "completed"),
      };
    }, [todos]);

    return (
      <div className="w-80 h-full relative flex-shrink-0">
        <div className="w-full h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col relative">
          <Tabs
            defaultValue="tasks"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-1">
              <TabsList className="m-4 bg-[var(--color-border-light)] flex gap-1 p-1 rounded-md w-[calc(100%-2rem)] h-auto justify-stretch">
                <TabsTrigger
                  value="tasks"
                  className="flex-1 text-sm px-4 py-2 rounded-sm bg-transparent transition-all duration-200 data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:text-[var(--color-text-primary)] data-[state=inactive]:hover:bg-[rgba(0,0,0,0.05)]"
                >
                  Tasks ({todos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex-1 text-sm px-4 py-2 rounded-sm bg-transparent transition-all duration-200 data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:text-[var(--color-text-primary)] data-[state=inactive]:hover:bg-[rgba(0,0,0,0.05)]"
                >
                  Files ({Object.keys(files).length})
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={openSettings}
                className="p-1 flex-shrink-0 hover:bg-[var(--color-border-light)]"
                title="Environment Settings"
              >
                <Settings size={18} />
              </Button>
            </div>

            <TabsContent
              value="tasks"
              className="flex-1 p-0 overflow-hidden"
            >
              <ScrollArea className="h-full">
                {todos.length === 0 ? (
                  <div className="p-12 text-center text-[var(--color-text-tertiary)]">
                    <p className="m-0 text-sm">No tasks yet</p>
                  </div>
                ) : (
                  <div className="p-4">
                    {groupedTodos.in_progress.length > 0 && (
                      <div className="mb-6 last:mb-0">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2">In Progress</h3>
                        {groupedTodos.in_progress.map((todo, index) => (
                          <div
                            key={`in_progress_${todo.id}_${index}`}
                            className="flex items-start gap-2 p-2 rounded-md mb-1 last:mb-0 transition-colors duration-200"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 text-sm leading-normal text-[var(--color-text-primary)]">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.pending.length > 0 && (
                      <div className="mb-6 last:mb-0">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2">Pending</h3>
                        {groupedTodos.pending.map((todo, index) => (
                          <div
                            key={`pending_${todo.id}_${index}`}
                            className="flex items-start gap-2 p-2 rounded-md mb-1 last:mb-0 transition-colors duration-200"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 text-sm leading-normal text-[var(--color-text-primary)]">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.completed.length > 0 && (
                      <div className="mb-6 last:mb-0">
                        <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-2">Completed</h3>
                        {groupedTodos.completed.map((todo, index) => (
                          <div
                            key={`completed_${todo.id}_${index}`}
                            className="flex items-start gap-2 p-2 rounded-md mb-1 last:mb-0 transition-colors duration-200"
                          >
                            {getStatusIcon(todo.status)}
                            <span className="flex-1 text-sm leading-normal text-[var(--color-text-primary)]">
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="files"
              className={styles.tabContent}
            >
              <ScrollArea className={styles.scrollArea}>
                {Object.keys(files).length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No files yet</p>
                  </div>
                ) : (
                  <div className={styles.fileTree}>
                    {Object.keys(files).map((file) => (
                      <div
                        key={file}
                        className={styles.fileItem}
                      >
                        <div
                          className={styles.fileRow}
                          onClick={() =>
                            onFileClick({ path: file, content: files[file] })
                          }
                        >
                          <FileText size={16} />
                          <span className={styles.fileName}>{file}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          {activeAssistant && !assistantError && (
            <OptimizationWindow
              threadId={threadId}
              deepAgentMessages={messages}
              isExpanded={isTrainingModeExpanded}
              onToggle={handleToggleTrainingMode}
              activeAssistant={activeAssistant}
              onAssistantUpdate={onAssistantUpdate}
            />
          )}
        </div>
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";













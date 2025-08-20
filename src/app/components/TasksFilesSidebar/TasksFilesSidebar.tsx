"use client";

import React, { useMemo, useCallback, useState } from "react";
import { FileText, CheckCircle, Circle, Clock, Settings } from "lucide-react";
import { useEnvConfig } from "@/providers/EnvConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { OptimizationWindow } from "../OptimizationWindow/OptimizationWindow";
import type { TodoItem, FileItem } from "../../types/types";

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
              className="flex-shrink-0 text-[var(--color-success)]"
            />
          );
        case "in_progress":
          return (
            <Clock
              size={16}
              className="flex-shrink-0 text-[var(--color-warning)]"
            />
          );
        default:
          return (
            <Circle
              size={16}
              className="flex-shrink-0 text-[var(--color-text-tertiary)]"
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
      <div className="relative h-full w-80 flex-shrink-0">
        <div className="relative flex h-full w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
          <Tabs
            defaultValue="tasks"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-1">
              <TabsList className="m-4 flex h-auto w-[calc(100%-2rem)] justify-stretch gap-1 rounded-md bg-[var(--color-border-light)] p-1">
                <TabsTrigger
                  value="tasks"
                  className="flex-1 rounded-sm bg-transparent px-4 py-2 text-sm transition-all duration-200 data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-[rgba(0,0,0,0.05)] data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Tasks ({todos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="flex-1 rounded-sm bg-transparent px-4 py-2 text-sm transition-all duration-200 data-[state=active]:bg-[var(--color-background)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-[rgba(0,0,0,0.05)] data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Files ({Object.keys(files).length})
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={openSettings}
                className="flex-shrink-0 p-1 hover:bg-[var(--color-border-light)]"
                title="Environment Settings"
              >
                <Settings size={18} />
              </Button>
            </div>

            <TabsContent
              value="tasks"
              className="flex-1 overflow-hidden p-0"
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
                        <h3 className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                          In Progress
                        </h3>
                        {groupedTodos.in_progress.map((todo, index) => (
                          <div
                            key={`in_progress_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-2 rounded-md p-2 transition-colors duration-200 last:mb-0"
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
                        <h3 className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                          Pending
                        </h3>
                        {groupedTodos.pending.map((todo, index) => (
                          <div
                            key={`pending_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-2 rounded-md p-2 transition-colors duration-200 last:mb-0"
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
                        <h3 className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
                          Completed
                        </h3>
                        {groupedTodos.completed.map((todo, index) => (
                          <div
                            key={`completed_${todo.id}_${index}`}
                            className="mb-1 flex items-start gap-2 rounded-md p-2 transition-colors duration-200 last:mb-0"
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
              className="flex-1 overflow-hidden p-0"
            >
              <ScrollArea className="h-full">
                {Object.keys(files).length === 0 ? (
                  <div className="p-12 text-center text-[var(--color-text-tertiary)]">
                    <p className="m-0 text-sm">No files yet</p>
                  </div>
                ) : (
                  <div className="p-4">
                    {Object.keys(files).map((file) => (
                      <div
                        key={file}
                        className="mb-1 w-full last:mb-0"
                      >
                        <div
                          className="flex cursor-pointer items-center gap-2 px-2 py-1 transition-colors duration-200 hover:bg-[var(--color-border-light)] [&_svg]:flex-shrink-0 [&_svg]:text-[var(--color-text-secondary)]"
                          onClick={() =>
                            onFileClick({ path: file, content: files[file] })
                          }
                        >
                          <FileText size={16} />
                          <span className="flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-[var(--color-text-primary)]">
                            {file}
                          </span>
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

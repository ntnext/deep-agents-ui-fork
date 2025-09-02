"use client";

import React, { useMemo, useCallback, useState } from "react";
import { FileText, CheckCircle, Circle, Clock, Settings, Plus, Copy } from "lucide-react";
import * as yaml from 'js-yaml';
import { useEnvConfig } from "@/providers/EnvConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { OptimizationWindow } from "../OptimizationWindow/OptimizationWindow";
import { FileCreationDialog } from "../FileCreationDialog/FileCreationDialog";
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
  onCreateFile: (fileName: string, content: string) => void;
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
    onCreateFile,
  }) => {
    const [isTrainingModeExpanded, setIsTrainingModeExpanded] = useState(false);
    const [isFileCreationDialogOpen, setIsFileCreationDialogOpen] = useState(false);
    const { openSettings } = useEnvConfig();

    const handleToggleTrainingMode = useCallback(() => {
      setIsTrainingModeExpanded((prev) => !prev);
    }, []);

    const handleOpenFileCreationDialog = useCallback(() => {
      setIsFileCreationDialogOpen(true);
    }, []);

    const handleCloseFileCreationDialog = useCallback(() => {
      setIsFileCreationDialogOpen(false);
    }, []);

    const handleCopyConfig = useCallback(async () => {
      if (!activeAssistant?.config?.configurable) return;
      
      const configText = yaml.dump(activeAssistant.config.configurable || {}, { indent: 2, lineWidth: -1 });
      try {
        await navigator.clipboard.writeText(configText);
        // Could add a toast notification here if desired
      } catch (err) {
        console.error('Failed to copy config:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = configText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }, [activeAssistant]);

    const getStatusIcon = useCallback((status: TodoItem["status"]) => {
      switch (status) {
        case "completed":
          return (
            <CheckCircle
              size={16}
              style={{
                color: "var(--color-success)",
                flexShrink: 0,
              }}
            />
          );
        case "in_progress":
          return (
            <Clock
              size={16}
              style={{
                color: "var(--color-warning)",
                flexShrink: 0,
              }}
            />
          );
        default:
          return (
            <Circle
              size={16}
              style={{
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
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
      <div
        style={{
          width: "25vw", // $sidebar-width
          height: "100%",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "var(--color-surface)",
            borderRight: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <Tabs
            defaultValue="tasks"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.25rem 1rem",
              }}
            >
              <TabsList
                style={{
                  margin: "1rem",
                  backgroundColor: "var(--color-border-light)",
                  display: "flex",
                  gap: "0.5rem",
                  padding: "0.25rem",
                  borderRadius: "0.375rem",
                  width: "calc(100% - 2rem)",
                  height: "auto",
                  justifyContent: "stretch",
                }}
              >
                <TabsTrigger
                  value="tasks"
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    transition: "all 200ms ease",
                  }}
                  className="data-[state=active]:!bg-[var(--color-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Tasks ({todos.length})
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    transition: "all 200ms ease",
                  }}
                  className="data-[state=active]:!bg-[var(--color-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Files ({Object.keys(files).length})
                </TabsTrigger>
                <TabsTrigger
                  value="config"
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    transition: "all 200ms ease",
                  }}
                  className="data-[state=active]:!bg-[var(--color-primary)] data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-[var(--color-text-secondary)] data-[state=inactive]:hover:bg-black/5 data-[state=inactive]:hover:text-[var(--color-text-primary)]"
                >
                  Config
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={openSettings}
                title="Environment Settings"
                style={{
                  padding: "0.25rem",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--color-border-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Settings size={18} />
              </Button>
            </div>

            <TabsContent
              value="tasks"
              style={{
                flex: 1,
                padding: 0,
                overflow: "hidden",
              }}
            >
              <ScrollArea style={{ height: "100%" }}>
                {todos.length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      No tasks yet
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "1rem" }}>
                    {groupedTodos.in_progress.length > 0 && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          In Progress
                        </h3>
                        {groupedTodos.in_progress.map((todo, index) => (
                          <div
                            key={`in_progress_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom: "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.pending.length > 0 && (
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Pending
                        </h3>
                        {groupedTodos.pending.map((todo, index) => (
                          <div
                            key={`pending_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom: "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {todo.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {groupedTodos.completed.length > 0 && (
                      <div style={{ marginBottom: 0 }}>
                        <h3
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--color-text-secondary)",
                            textTransform: "uppercase",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Completed
                        </h3>
                        {groupedTodos.completed.map((todo, index) => (
                          <div
                            key={`completed_${todo.id}_${index}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.5rem",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              marginBottom:
                                index === groupedTodos.completed.length - 1
                                  ? 0
                                  : "0.25rem",
                              transition: "background-color 200ms ease",
                            }}
                          >
                            {getStatusIcon(todo.status)}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "0.875rem",
                                lineHeight: 1.5,
                                color: "var(--color-text-primary)",
                              }}
                            >
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
              style={{
                flex: 1,
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "1rem", paddingBottom: "0.5rem" }}>
                <Button
                  onClick={handleOpenFileCreationDialog}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Plus size={16} />
                  Create New File
                </Button>
              </div>
              <ScrollArea style={{ flex: 1 }}>
                {Object.keys(files).length === 0 ? (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                      No files yet
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: "1rem", paddingTop: "0.5rem" }}>
                    {Object.keys(files).map((file, index) => (
                      <div
                        key={file}
                        style={{
                          width: "100%",
                          marginBottom:
                            index === Object.keys(files).length - 1
                              ? 0
                              : "0.25rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem",
                            cursor: "pointer",
                            borderRadius: "0.375rem",
                            transition: "background-color 200ms ease",
                          }}
                          onClick={() =>
                            onFileClick({ path: file, content: files[file] })
                          }
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--color-border-light)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <FileText
                            size={16}
                            style={{
                              flexShrink: 0,
                              color: "var(--color-text-secondary)",
                            }}
                          />
                          <span
                            style={{
                              flex: 1,
                              fontSize: "0.875rem",
                              color: "var(--color-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="config"
              style={{
                flex: 1,
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "1rem", paddingBottom: "0.5rem" }}>
                <Button
                  onClick={handleCopyConfig}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    border: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    transition: "all 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.9";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                  disabled={!activeAssistant || assistantError}
                >
                  <Copy size={16} />
                  Copy Configuration
                </Button>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ScrollArea 
                  style={{ 
                    height: "100%",
                    width: "100%"
                  }}
                >
                  {!activeAssistant || assistantError ? (
                    <div
                      style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        {assistantError ? "Failed to load agent config" : "No agent loaded"}
                      </p>
                    </div>
                  ) : (
                    <div style={{ padding: "1rem", paddingTop: "0.5rem" }}>
                      <div
                        style={{
                          backgroundColor: "#0d1117",
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.5rem",
                          padding: "1rem",
                          fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
                          fontSize: "0.75rem",
                          lineHeight: "1.4",
                          color: "#e6edf3",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {yaml.dump(activeAssistant.config.configurable || {}, { indent: 2, lineWidth: -1 })}
                      </div>
                      <div
                        style={{
                          marginTop: "1rem",
                          padding: "0.75rem",
                          backgroundColor: "var(--color-border-light)",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.4,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 500 }}>
                          Agent: {activeAssistant.name || activeAssistant.assistant_id}
                        </p>
                        {activeAssistant.metadata?.created_at && (
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem" }}>
                            Created: {new Date(activeAssistant.metadata.created_at).toLocaleString()}
                          </p>
                        )}
                        {activeAssistant.metadata?.updated_at && (
                          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem" }}>
                            Updated: {new Date(activeAssistant.metadata.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
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
        <FileCreationDialog
          isOpen={isFileCreationDialogOpen}
          onClose={handleCloseFileCreationDialog}
          onCreateFile={onCreateFile}
        />
      </div>
    );
  },
);

TasksFilesSidebar.displayName = "TasksFilesSidebar";

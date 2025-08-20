"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Expand, X, Send, RotateCcw, Loader2 } from "lucide-react";
import * as Diff from "diff";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { useStream } from "@langchain/langgraph-sdk/react";
import { createClient, getOptimizerClient } from "@/lib/client";
import { Assistant, type Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { useEnvConfig } from "@/providers/EnvConfig";
import { prepareOptimizerMessage } from "@/app/utils/utils";

type StateType = {
  messages: Message[];
  agent_messages: Message[];
  files: Record<string, string>;
};

type UserMessage = {
  type: "user";
  content: string;
};

type OptimizerMessage = {
  type: "optimizer";
  id: string;
  status: "approved" | "rejected" | "pending";
  old_config: Record<string, unknown>;
  new_config: Record<string, unknown>;
};

interface OptimizationWindowProps {
  threadId: string | null;
  deepAgentMessages: Message[];
  isExpanded: boolean;
  onToggle: () => void;
  activeAssistant: Assistant | null;
  onAssistantUpdate: () => void;
}

type DisplayMessage = UserMessage | OptimizerMessage;

export const OptimizationWindow = React.memo<OptimizationWindowProps>(
  ({
    threadId,
    deepAgentMessages,
    isExpanded,
    onToggle,
    activeAssistant,
    onAssistantUpdate,
  }) => {
    const { config } = useEnvConfig();
    const [optimizerThreadId, setOptimizerThreadId] = useState<string | null>(
      null,
    );
    const [feedbackInput, setFeedbackInput] = useState("");
    const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
    const [selectedOptimizerMessage, setSelectedOptimizerMessage] =
      useState<OptimizerMessage | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(
      [],
    );

    const deploymentUrl = config?.DEPLOYMENT_URL || "";
    const langsmithApiKey = config?.LANGSMITH_API_KEY || "filler-token";
    const deploymentClient = useMemo(
      () => createClient(deploymentUrl, langsmithApiKey),
      [deploymentUrl, langsmithApiKey],
    );
    const optimizerClient = useMemo(() => getOptimizerClient(), []);

    const onFinish = useCallback(
      (state: { values: { files: { [key: string]: string } } }) => {
        const optimizerMessage: OptimizerMessage = {
          type: "optimizer",
          id: uuidv4(),
          status: "pending",
          old_config: activeAssistant?.config.configurable || {},
          new_config: JSON.parse(state.values.files["config.json"]),
        };
        setDisplayMessages((prev) => [...prev, optimizerMessage]);
      },
      [activeAssistant],
    );

    const stream = useStream<StateType>({
      client: optimizerClient,
      threadId: optimizerThreadId ?? null,
      assistantId: "optimizer", // TODO: change to the optimizer assistant id
      onFinish: onFinish,
      onThreadId: setOptimizerThreadId,
      defaultHeaders: {
        "x-auth-scheme": "langsmith",
      },
    });

    const isLoading = stream.isLoading;

    const handleSubmitFeedback = useCallback(
      (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }
        setFeedbackInput("");
        setDisplayMessages((prev) => [
          ...prev,
          { type: "user", content: feedbackInput },
        ]);
        const humanMessage: Message = {
          id: uuidv4(),
          type: "human",
          content: prepareOptimizerMessage(feedbackInput),
        };
        stream.submit({
          messages: [humanMessage],
          files: {
            "config.json": JSON.stringify(
              activeAssistant?.config.configurable || {},
              null,
              2,
            ),
            "conversation.json": JSON.stringify(deepAgentMessages, null, 2),
          },
        });
      },
      [feedbackInput, stream, activeAssistant, deepAgentMessages],
    );

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 120) + "px";
      }
    }, [feedbackInput]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmitFeedback();
        }
      },
      [handleSubmitFeedback],
    );

    const handleClear = useCallback(() => {
      stream.stop();
      setOptimizerThreadId(null);
      setFeedbackInput("");
      setDisplayMessages([]);
    }, [stream, setOptimizerThreadId, setFeedbackInput, setDisplayMessages]);

    // Clear the optimizer window when the threadId is cleared
    const prevThreadIdRef = useRef<string | null>(threadId);

    useEffect(() => {
      if (prevThreadIdRef.current !== null && threadId === null) {
        handleClear();
      }
      prevThreadIdRef.current = threadId;
    }, [threadId, handleClear]);

    const isUserMessage = (message: DisplayMessage): message is UserMessage => {
      return message.type === "user";
    };

    const isOptimizerMessage = (
      message: DisplayMessage,
    ): message is OptimizerMessage => {
      return message.type === "optimizer";
    };

    const handleOptimizerMessageClick = useCallback(
      (message: OptimizerMessage) => {
        if (message.status === "pending") {
          setSelectedOptimizerMessage(message);
          setIsDiffDialogOpen(true);
        }
      },
      [],
    );

    const handleApprove = useCallback(() => {
      if (selectedOptimizerMessage) {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
              ? { ...msg, status: "approved" as const }
              : msg,
          ),
        );
        handleClear();
        if (activeAssistant) {
          deploymentClient.assistants
            .update(activeAssistant.assistant_id, {
              config: {
                configurable: selectedOptimizerMessage.new_config,
              },
            })
            .then(() => {
              // Wait a bit for the update to propagate
              setTimeout(() => {
                onAssistantUpdate();
              }, 500);
            });
        }
        setIsDiffDialogOpen(false);
        setSelectedOptimizerMessage(null);
      }
    }, [
      selectedOptimizerMessage,
      handleClear,
      activeAssistant,
      onAssistantUpdate,
      deploymentClient.assistants,
    ]);

    const handleReject = useCallback(() => {
      if (selectedOptimizerMessage) {
        setDisplayMessages((prev) =>
          prev.map((msg) =>
            isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
              ? { ...msg, status: "rejected" as const }
              : msg,
          ),
        );
        setIsDiffDialogOpen(false);
        setSelectedOptimizerMessage(null);
      }
    }, [selectedOptimizerMessage]);

    const handleCloseDiffDialog = useCallback(() => {
      setIsDiffDialogOpen(false);
      setSelectedOptimizerMessage(null);
    }, []);

    const createSideBySideDiff = useCallback(
      (
        oldConfig: Record<string, unknown>,
        newConfig: Record<string, unknown>,
      ) => {
        const oldStr = JSON.stringify(oldConfig, null, 2);
        const newStr = JSON.stringify(newConfig, null, 2);

        const oldLines = oldStr.split("\n");
        const newLines = newStr.split("\n");

        const maxLines = Math.max(oldLines.length, newLines.length);
        const result = [];

        for (let i = 0; i < maxLines; i++) {
          const oldLine = oldLines[i] || "";
          const newLine = newLines[i] || "";

          let oldHighlighted = oldLine;
          let newHighlighted = newLine;

          if (oldLine !== newLine) {
            const wordDiff = Diff.diffWords(oldLine, newLine);

            oldHighlighted = "";
            newHighlighted = "";

            wordDiff.forEach((part) => {
              if (part.removed) {
                oldHighlighted += `<span class="word-removed">${part.value}</span>`;
              } else if (part.added) {
                newHighlighted += `<span class="word-added">${part.value}</span>`;
              } else {
                oldHighlighted += part.value;
                newHighlighted += part.value;
              }
            });
          }

          result.push({
            lineNumber: i + 1,
            oldLine: oldHighlighted,
            newLine: newHighlighted,
            hasChanges: oldLine !== newLine,
          });
        }

        return result;
      },
      [],
    );

    return (
      <>
        <div
          className={cn(
            "absolute right-0 bottom-0 left-0 z-10 flex h-12 flex-col overflow-hidden rounded-t-[10px] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] transition-[height] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            isExpanded && "h-1/2",
          )}
        >
          <div className="rounded-t-2 relative m-0 flex h-12 min-h-12 items-center overflow-hidden border-none bg-[var(--color-primary)] p-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex h-full flex-1 cursor-pointer items-center justify-between border-none bg-transparent px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.1)] focus:bg-[rgba(255,255,255,0.1)] focus:outline-none"
                    onClick={onToggle}
                    disabled={!optimizerClient}
                    aria-label={
                      isExpanded
                        ? "Collapse Training Mode"
                        : "Expand Training Mode"
                    }
                  >
                    <span className="font-medium">
                      {optimizerClient
                        ? "Deep Agent Optimizer"
                        : "(Disabled) Deep Agent Optimizer"}
                    </span>
                    {isExpanded ? (
                      <X
                        size={16}
                        className="text-[rgba(255,255,255,0.8)] transition-transform duration-200 ease-out hover:text-white"
                      />
                    ) : (
                      optimizerClient && (
                        <Expand
                          size={16}
                          className="text-[rgba(255,255,255,0.8)] transition-transform duration-200 ease-out hover:text-white"
                        />
                      )
                    )}
                  </button>
                </TooltipTrigger>
                {!optimizerClient && (
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="bottom"
                      sideOffset={5}
                      className="z-50 rounded-md bg-[var(--color-text-primary)] px-3 py-2 text-sm text-white shadow-lg"
                    >
                      <p>
                        Set Optimizer Agent Environment Variables in FE
                        Deployment
                      </p>
                      <TooltipPrimitive.Arrow className="fill-[var(--color-text-primary)]" />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                )}
              </Tooltip>
            </TooltipProvider>
            {isExpanded && displayMessages.length > 0 && (
              <button
                className="absolute top-1/2 right-12 z-[1] flex -translate-y-1/2 cursor-pointer items-center justify-center rounded border-none bg-transparent p-1.5 text-[rgba(255,255,255,0.7)] transition-all duration-200 hover:bg-[rgba(255,255,255,0.1)] hover:text-white active:scale-95"
                onClick={handleClear}
                aria-label="Clear conversation"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col opacity-0 transition-opacity delay-100 duration-300",
              isExpanded && "opacity-100",
            )}
          >
            <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
              <div className="flex flex-1 flex-col overflow-hidden bg-[var(--color-background)] p-0">
                <div className="m-0 flex-1 overflow-hidden border-none bg-[var(--color-background)]">
                  <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
                    {displayMessages.map((message, index) => {
                      if (isUserMessage(message)) {
                        return (
                          <div
                            key={`user-${index}`}
                            className="mb-2 flex justify-end"
                          >
                            <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--color-user-message)] px-3.5 py-2.5 text-sm leading-[1.4] break-words text-white">
                              {message.content}
                            </div>
                          </div>
                        );
                      } else if (isOptimizerMessage(message)) {
                        return (
                          <div
                            key={message.id}
                            className="mb-2 flex justify-start"
                          >
                            <button
                              className={cn(
                                "flex max-w-[80%] cursor-pointer items-center gap-2 rounded-lg border-none px-4 py-3 text-sm font-medium transition-all duration-200",
                                message.status === "pending" &&
                                  "border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.1)] text-[#d97706] hover:bg-[rgba(251,191,36,0.2)]",
                                message.status === "approved" &&
                                  "border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] text-[#059669] hover:bg-[rgba(34,197,94,0.2)]",
                                message.status === "rejected" &&
                                  "border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#dc2626] hover:bg-[rgba(239,68,68,0.2)]",
                              )}
                              onClick={() =>
                                handleOptimizerMessageClick(message)
                              }
                              disabled={message.status !== "pending"}
                            >
                              <span className="text-base leading-none">
                                {message.status === "approved" && "✓"}
                                {message.status === "rejected" && "✗"}
                                {message.status === "pending" && ""}
                              </span>
                              <span className="font-medium">
                                {message.status === "approved" &&
                                  "Configuration Approved"}
                                {message.status === "rejected" &&
                                  "Configuration Rejected"}
                                {message.status === "pending" &&
                                  "Configuration Pending Review"}
                              </span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}
                    {isLoading && (
                      <div className="mb-2 flex justify-start">
                        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-secondary)]">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          <span>Analyzing feedback...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <form
                className="flex gap-2"
                onSubmit={handleSubmitFeedback}
              >
                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    className="max-h-[120px] min-h-[40px] w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your feedback..."
                    aria-label="Feedback input"
                    rows={1}
                  />
                  <button
                    type="submit"
                    className="hover:not(:disabled):bg-[var(--color-primary-dark)] flex cursor-pointer items-center justify-center rounded-lg border-none bg-[var(--color-primary)] px-3 py-2 text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!feedbackInput.trim()}
                    aria-label="Send feedback"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {isDiffDialogOpen && selectedOptimizerMessage && (
          <div
            className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
            onClick={handleCloseDiffDialog}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-[var(--color-background)] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] p-6">
                <h2>Configuration Changes</h2>
                <button
                  className="rounded-md p-2 transition-colors duration-200 hover:bg-[var(--color-border-light)]"
                  onClick={handleCloseDiffDialog}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <div className="grid h-full grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <h3>Current Configuration</h3>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm">
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`old-${index}`}
                            className={cn(
                              "block px-2 py-1 leading-tight",
                              line.hasChanges &&
                                "border-l-4 border-[var(--color-error)] bg-[rgba(239,68,68,0.1)]",
                            )}
                            dangerouslySetInnerHTML={{ __html: line.oldLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h3>Proposed Configuration</h3>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm">
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`new-${index}`}
                            className={cn(
                              "block px-2 py-1 leading-tight",
                              line.hasChanges &&
                                "border-l-4 border-[var(--color-success)] bg-[rgba(34,197,94,0.1)]",
                            )}
                            dangerouslySetInnerHTML={{ __html: line.newLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[var(--color-border)] p-6">
                <button
                  className="rounded-md border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] px-4 py-2 font-medium text-[#dc2626] transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]"
                  onClick={handleReject}
                >
                  Reject Changes
                </button>
                <button
                  className="rounded-md border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-4 py-2 font-medium text-[#059669] transition-all duration-200 hover:bg-[rgba(34,197,94,0.2)]"
                  onClick={handleApprove}
                >
                  Approve Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);

OptimizationWindow.displayName = "OptimizationWindow";

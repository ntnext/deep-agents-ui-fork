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
            "absolute bottom-0 left-0 right-0 bg-[var(--color-surface)] z-10 flex flex-col transition-[height] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] h-12 overflow-hidden border-2 border-[var(--color-primary)] rounded-t-[10px]",
            isExpanded && "h-1/2"
          )}
        >
          <div className="h-12 min-h-12 bg-[var(--color-primary)] flex items-center p-0 relative rounded-t-2 m-0 border-none overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="flex-1 h-full px-4 bg-transparent border-none text-white text-sm font-medium cursor-pointer flex items-center justify-between transition-colors duration-200 hover:bg-[rgba(255,255,255,0.1)] focus:outline-none focus:bg-[rgba(255,255,255,0.1)]"
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
                      className="px-3 py-2 bg-[var(--color-text-primary)] text-white text-sm rounded-md shadow-lg z-50"
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
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-transparent border-none text-[rgba(255,255,255,0.7)] cursor-pointer rounded flex items-center justify-center transition-all duration-200 z-[1] hover:bg-[rgba(255,255,255,0.1)] hover:text-white active:scale-95"
                onClick={handleClear}
                aria-label="Clear conversation"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex-1 flex flex-col opacity-0 transition-opacity duration-300 delay-100",
              isExpanded && "opacity-100"
            )}
          >
            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-background)]">
              <div className="flex-1 flex flex-col p-0 overflow-hidden bg-[var(--color-background)]">
                <div className="flex-1 overflow-hidden m-0 bg-[var(--color-background)] border-none">
                  <div className="h-full overflow-y-auto p-4 flex flex-col gap-3">
                    {displayMessages.map((message, index) => {
                      if (isUserMessage(message)) {
                        return (
                          <div
                            key={`user-${index}`}
                            className="flex justify-end mb-2"
                          >
                            <div className="bg-[var(--color-user-message)] text-white py-2.5 px-3.5 rounded-2xl rounded-br-sm max-w-[80%] break-words text-sm leading-[1.4]">
                              {message.content}
                            </div>
                          </div>
                        );
                      } else if (isOptimizerMessage(message)) {
                        return (
                          <div
                            key={message.id}
                            className="flex justify-start mb-2"
                          >
                            <button
                              className={cn(
                                "flex items-center gap-2 py-3 px-4 border-none rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 max-w-[80%]",
                                message.status === "pending" && "bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.3)] text-[#d97706] hover:bg-[rgba(251,191,36,0.2)]",
                                message.status === "approved" && "bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#059669] hover:bg-[rgba(34,197,94,0.2)]",
                                message.status === "rejected" && "bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#dc2626] hover:bg-[rgba(239,68,68,0.2)]"
                              )}
                              onClick={() =>
                                handleOptimizerMessageClick(message)
                              }
                              disabled={message.status !== "pending"}
                            >
                              <span className={styles.statusIcon}>
                                {message.status === "approved" && "✓"}
                                {message.status === "rejected" && "✗"}
                                {message.status === "pending" && ""}
                              </span>
                              <span className={styles.statusText}>
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
                      <div className={styles.loadingMessage}>
                        <div className={styles.loadingContent}>
                          <Loader2
                            size={16}
                            className={styles.spinner}
                          />
                          <span>Analyzing feedback...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.paneFooter}>
              <form
                className={styles.inputForm}
                onSubmit={handleSubmitFeedback}
              >
                <div className={styles.inputWrapper}>
                  <textarea
                    ref={textareaRef}
                    className={styles.feedbackInput}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your feedback..."
                    aria-label="Feedback input"
                    rows={1}
                  />
                  <button
                    type="submit"
                    className={styles.sendButton}
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
            className={styles.dialogOverlay}
            onClick={handleCloseDiffDialog}
          >
            <div
              className={styles.diffDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.dialogHeader}>
                <h2>Configuration Changes</h2>
                <button
                  className={styles.closeButton}
                  onClick={handleCloseDiffDialog}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.dialogContent}>
                <div className={styles.sideBySideContainer}>
                  <div className={styles.diffSection}>
                    <h3>Current Configuration</h3>
                    <div className={styles.codeSection}>
                      <div className={styles.diffCodeBlock}>
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`old-${index}`}
                            className={`${styles.codeLine} ${line.hasChanges ? styles.changedLine : ""}`}
                            dangerouslySetInnerHTML={{ __html: line.oldLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.diffSection}>
                    <h3>Proposed Configuration</h3>
                    <div className={styles.codeSection}>
                      <div className={styles.diffCodeBlock}>
                        {createSideBySideDiff(
                          selectedOptimizerMessage.old_config,
                          selectedOptimizerMessage.new_config,
                        ).map((line, index) => (
                          <div
                            key={`new-${index}`}
                            className={`${styles.codeLine} ${line.hasChanges ? styles.changedLine : ""}`}
                            dangerouslySetInnerHTML={{ __html: line.newLine }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.dialogActions}>
                <button
                  className={styles.rejectButton}
                  onClick={handleReject}
                >
                  Reject Changes
                </button>
                <button
                  className={styles.approveButton}
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












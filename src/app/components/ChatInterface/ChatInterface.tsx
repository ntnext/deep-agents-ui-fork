"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Send,
  Bot,
  LoaderCircle,
  SquarePen,
  History,
  Square,
} from "lucide-react";
import { ChatMessage } from "../ChatMessage/ChatMessage";
import { ThreadHistorySidebar } from "../ThreadHistorySidebar/ThreadHistorySidebar";
import type { SubAgent, ToolCall } from "../../types/types";
import { cn } from "@/lib/utils";
import {
  AIMessage,
  Checkpoint,
  Message,
  type Interrupt,
} from "@langchain/langgraph-sdk";
import {
  extractStringFromMessageContent,
  isPreparingToCallTaskTool,
  justCalledTaskTool,
} from "../../utils/utils";
import { v4 as uuidv4 } from "uuid";

interface ChatInterfaceProps {
  threadId: string | null;
  messages: Message[];
  isLoading: boolean;
  selectedSubAgent: SubAgent | null;
  sendMessage: (message: string) => void;
  stopStream: () => void;
  getMessagesMetadata: (
    message: Message,
    index?: number,
  ) =>
    | { firstSeenState?: { parent_checkpoint?: Checkpoint | null } }
    | undefined;
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
  ) => void;
  onSelectSubAgent: (subAgent: SubAgent | null) => void;
  onNewThread: () => void;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  runSingleStep: (
    messages: Message[],
    checkpoint?: Checkpoint,
    isRerunningSubagent?: boolean,
  ) => void;
  continueStream: (hasTaskToolCall?: boolean) => void;
  interrupt: Interrupt | undefined;
  isLoadingThreadState: boolean;
  assistantError: string | null;
}

export const ChatInterface = React.memo<ChatInterfaceProps>(
  ({
    threadId,
    messages,
    isLoading,
    selectedSubAgent,
    sendMessage,
    stopStream,
    getMessagesMetadata,
    setThreadId,
    onSelectSubAgent,
    onNewThread,
    debugMode,
    setDebugMode,
    runSingleStep,
    continueStream,
    isLoadingThreadState,
    interrupt,
    assistantError,
  }) => {
    const [input, setInput] = useState("");
    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          Math.min(textareaRef.current.scrollHeight, 120) + "px";
      }
    }, [input]);

    const handleSubmit = useCallback(
      (e?: FormEvent) => {
        if (e) {
          e.preventDefault();
        }
        const messageText = input.trim();
        if (!messageText || isLoading) return;
        if (debugMode) {
          runSingleStep([
            {
              id: uuidv4(),
              type: "human",
              content: messageText,
            },
          ]);
        } else {
          sendMessage(messageText);
        }
        setInput("");
      },
      [input, isLoading, sendMessage, debugMode, runSingleStep],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit],
    );

    const handleNewThread = useCallback(() => {
      // Cancel any ongoing thread when creating new thread
      if (isLoading) {
        stopStream();
      }
      setIsThreadHistoryOpen(false);
      onNewThread();
    }, [isLoading, stopStream, onNewThread]);

    const handleThreadSelect = useCallback(
      (id: string) => {
        setThreadId(id);
        setIsThreadHistoryOpen(false);
      },
      [setThreadId],
    );

    const toggleThreadHistory = useCallback(() => {
      setIsThreadHistoryOpen((prev) => !prev);
    }, []);

    const handleContinue = useCallback(() => {
      const preparingToCallTaskTool = isPreparingToCallTaskTool(messages);
      continueStream(preparingToCallTaskTool);
    }, [continueStream, messages]);

    const handleRerunStep = useCallback(() => {
      const hasTaskToolCall = justCalledTaskTool(messages);
      let rewindIndex = messages.length - 2;
      if (hasTaskToolCall) {
        rewindIndex = messages.findLastIndex(
          (message) => message.type === "ai",
        );
        // Clear selected subAgent when replaying deletes it
        const aiMessageToUnwind = messages[rewindIndex] as AIMessage;
        if (
          aiMessageToUnwind &&
          aiMessageToUnwind.tool_calls &&
          aiMessageToUnwind.tool_calls.some(
            (toolCall) => toolCall.id === selectedSubAgent?.id,
          )
        ) {
          onSelectSubAgent(null);
        }
      }
      const meta = getMessagesMetadata(messages[rewindIndex]);
      const firstSeenState = meta?.firstSeenState;
      const { parent_checkpoint: parentCheckpoint } = firstSeenState ?? {};
      runSingleStep([], parentCheckpoint ?? undefined, hasTaskToolCall);
    }, [
      messages,
      runSingleStep,
      getMessagesMetadata,
      onSelectSubAgent,
      selectedSubAgent,
    ]);

    const hasMessages = messages.length > 0;
    const processedMessages = useMemo(() => {
      /* 
    1. Loop through all messages
    2. For each AI message, add the AI message, and any tool calls to the messageMap
    3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
    */
      const messageMap = new Map<
        string,
        { message: Message; toolCalls: ToolCall[] }
      >();
      messages.forEach((message: Message) => {
        if (message.type === "ai") {
          const toolCallsInMessage: Array<{
            id?: string;
            function?: { name?: string; arguments?: unknown };
            name?: string;
            type?: string;
            args?: unknown;
            input?: unknown;
          }> = [];
          if (
            message.additional_kwargs?.tool_calls &&
            Array.isArray(message.additional_kwargs.tool_calls)
          ) {
            toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
          } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
            toolCallsInMessage.push(
              ...message.tool_calls.filter(
                (toolCall: { name?: string }) => toolCall.name !== "",
              ),
            );
          } else if (Array.isArray(message.content)) {
            const toolUseBlocks = message.content.filter(
              (block: { type?: string }) => block.type === "tool_use",
            );
            toolCallsInMessage.push(...toolUseBlocks);
          }
          const toolCallsWithStatus = toolCallsInMessage.map(
            (toolCall: {
              id?: string;
              function?: { name?: string; arguments?: unknown };
              name?: string;
              type?: string;
              args?: unknown;
              input?: unknown;
            }) => {
              const name =
                toolCall.function?.name ||
                toolCall.name ||
                toolCall.type ||
                "unknown";
              const args =
                toolCall.function?.arguments ||
                toolCall.args ||
                toolCall.input ||
                {};
              return {
                id: toolCall.id || `tool-${Math.random()}`,
                name,
                args,
                status: "pending" as const,
              } as ToolCall;
            },
          );
          messageMap.set(message.id!, {
            message,
            toolCalls: toolCallsWithStatus,
          });
        } else if (message.type === "tool") {
          const toolCallId = message.tool_call_id;
          if (!toolCallId) {
            return;
          }
          for (const [, data] of messageMap.entries()) {
            const toolCallIndex = data.toolCalls.findIndex(
              (tc: ToolCall) => tc.id === toolCallId,
            );
            if (toolCallIndex === -1) {
              continue;
            }
            data.toolCalls[toolCallIndex] = {
              ...data.toolCalls[toolCallIndex],
              status: "completed" as const,
              result: extractStringFromMessageContent(message),
            };
            break;
          }
        } else if (message.type === "human") {
          messageMap.set(message.id!, {
            message,
            toolCalls: [],
          });
        }
      });
      const processedArray = Array.from(messageMap.values());
      return processedArray.map((data, index) => {
        const prevMessage =
          index > 0 ? processedArray[index - 1].message : null;
        return {
          ...data,
          showAvatar: data.message.type !== prevMessage?.type,
        };
      });
    }, [messages]);

    return (
      <div className="flex flex-col h-screen w-full bg-[var(--color-background)]">
        <div className="flex justify-between items-center px-6 py-4 h-[60px] border-b border-[var(--color-border)] bg-[var(--color-background)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-[var(--color-primary)]" />
            <h1 className="text-xl font-semibold m-0">Deep Agent</h1>
          </div>
          <div className="flex items-center gap-2 [&_button:hover:not(:disabled)]:bg-[var(--color-border-light)] [&_button:disabled]:opacity-50 [&_button:disabled]:cursor-not-allowed">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewThread}
              disabled={!hasMessages}
            >
              <SquarePen size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleThreadHistory}
            >
              <History size={20} />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex relative overflow-hidden">
          <ThreadHistorySidebar
            open={isThreadHistoryOpen}
            setOpen={setIsThreadHistoryOpen}
            currentThreadId={threadId}
            onThreadSelect={handleThreadSelect}
          />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {!hasMessages && !isLoading && !isLoadingThreadState && (
              <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <Bot
                  size={48}
                  className="text-[var(--color-text-tertiary)] mb-6"
                />
                <h2 className="mb-2 text-[var(--color-text-primary)]">Start a conversation or select a thread from history</h2>
              </div>
            )}
            {isLoadingThreadState && (
              <div className="flex pt-[100px] justify-center h-full w-full absolute top-0 left-0 bg-[var(--color-background)] z-10">
                <LoaderCircle className="animate-spin" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 pb-[100px]">
              {processedMessages.map((data) => (
                <ChatMessage
                  key={data.message.id}
                  message={data.message}
                  toolCalls={data.toolCalls}
                  showAvatar={data.showAvatar}
                  onSelectSubAgent={onSelectSubAgent}
                  selectedSubAgent={selectedSubAgent}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 text-[var(--color-text-secondary)]">
                  <LoaderCircle className="animate-spin" />
                  <span>Working...</span>
                </div>
              )}
              {interrupt && debugMode && (
                <div className="flex items-center gap-2 py-4 ml-10">
                  <Button
                    onClick={handleContinue}
                    className="px-1 py-4 bg-transparent text-[var(--color-success)] border border-[var(--color-success)] font-medium rounded-sm text-sm transition-all duration-200 hover:bg-[rgba(16,185,129,0.1)] hover:text-[var(--color-success)] hover:border-[var(--color-success)] active:bg-[rgba(16,185,129,0.2)]"
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleRerunStep}
                    className="px-1 py-4 bg-transparent text-[#8b5cf6] border border-[#8b5cf6] font-medium rounded-sm text-sm transition-all duration-200 hover:bg-[rgba(139,92,246,0.1)] hover:text-[#8b5cf6] hover:border-[#8b5cf6] active:bg-[rgba(139,92,246,0.2)]"
                  >
                    Re-run step
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-[var(--color-background)] border-t border-[var(--color-border)]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 max-w-4xl mx-auto"
          >
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLoading || !!interrupt
                    ? "Running..."
                    : "Type your message..."
                }
                disabled={isLoading || !!interrupt || !!assistantError}
                className={styles.input}
                rows={1}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={styles.debugToggle}>
                      <label
                        htmlFor="debug-mode"
                        className={styles.debugLabel}
                      >
                        Debug Mode
                      </label>
                      <Switch
                        id="debug-mode"
                        checked={debugMode}
                        onCheckedChange={setDebugMode}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                      side="top"
                      sideOffset={5}
                      className={styles.tooltip}
                    >
                      <p>Run the agent step-by-step</p>
                      <TooltipPrimitive.Arrow className={styles.tooltipArrow} />
                    </TooltipPrimitive.Content>
                  </TooltipPrimitive.Portal>
                </Tooltip>
              </TooltipProvider>
              {isLoading ? (
                <button
                  type="button"
                  onClick={stopStream}
                  className={styles.stopButton}
                >
                  <Square size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || !!assistantError}
                  className={styles.sendButton}
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";








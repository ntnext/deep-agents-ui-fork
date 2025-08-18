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
import { Tooltip, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Send, Bot, LoaderCircle, SquarePen, History, Square } from "lucide-react";
import { ChatMessage } from "../ChatMessage/ChatMessage";
import { ThreadHistorySidebar } from "../ThreadHistorySidebar/ThreadHistorySidebar";
import type { SubAgent, ToolCall } from "../../types/types";
import styles from "./ChatInterface.module.scss";
import { Checkpoint, Message, type Interrupt } from "@langchain/langgraph-sdk";
import { extractStringFromMessageContent, isPreparingToCallTaskTool, justCalledTaskTool } from "../../utils/utils";
import { v4 as uuidv4 } from "uuid";

interface ChatInterfaceProps {
  threadId: string | null;
  messages: Message[];
  isLoading: boolean;
  selectedSubAgent: SubAgent | null;
  sendMessage: (message: string) => void;
  stopStream: () => void;
  getMessagesMetadata: (message: Message) => any;
  setThreadId: (
    value: string | ((old: string | null) => string | null) | null,
  ) => void;
  onSelectSubAgent: (subAgent: SubAgent) => void;
  onNewThread: () => void;
  debugMode: boolean;
  setDebugMode: (debugMode: boolean) => void;
  runSingleStep: (messages: Message[], checkpoint?: Checkpoint, isRerunningSubagent?: boolean) => void;
  continueStream: (hasTaskToolCall?: boolean) => void;
  interrupt: Interrupt | undefined;
  isLoadingThreadState: boolean;
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
  }) => {
    const [input, setInput] = useState("");
    const [isThreadHistoryOpen, setIsThreadHistoryOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = useCallback(
      (e: FormEvent) => {
        e.preventDefault();
        const messageText = input.trim();
        if (!messageText || isLoading) return;
        if (debugMode) {
          runSingleStep([{
            id: uuidv4(),
            type: "human",
            content: messageText,
          }]);
        } else {
          sendMessage(messageText);
        }
        setInput("");
      },
      [input, isLoading, sendMessage, debugMode, runSingleStep],
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
        rewindIndex = messages.findLastIndex((message) => message.type === "ai");
      }
      const meta = getMessagesMetadata(messages[rewindIndex]);
      console.log("meta", meta);
      const toolMessageMeta = getMessagesMetadata(messages[rewindIndex]);
      console.log("tool message meta", toolMessageMeta);
      const firstSeenState = toolMessageMeta.firstSeenState;
      const { parent_checkpoint: parentCheckpoint } = firstSeenState ?? {};
      runSingleStep([], parentCheckpoint, hasTaskToolCall);
    }, [messages, runSingleStep, getMessagesMetadata]);

    const hasMessages = messages.length > 0;

    const processedMessages = useMemo(() => {
      /* 
    1. Loop through all messages
    2. For each AI message, add the AI message, and any tool calls to the messageMap
    3. For each tool message, find the corresponding tool call in the messageMap and update the status and output
    */
      const messageMap = new Map<string, any>();
      messages.forEach((message: Message) => {
        if (message.type === "ai") {
          const toolCallsInMessage: any[] = [];
          if (
            message.additional_kwargs?.tool_calls &&
            Array.isArray(message.additional_kwargs.tool_calls)
          ) {
            toolCallsInMessage.push(...message.additional_kwargs.tool_calls);
          } else if (message.tool_calls && Array.isArray(message.tool_calls)) {
            toolCallsInMessage.push(
              ...message.tool_calls.filter(
                (toolCall: any) => toolCall.name !== "",
              ),
            );
          } else if (Array.isArray(message.content)) {
            const toolUseBlocks = message.content.filter(
              (block: any) => block.type === "tool_use",
            );
            toolCallsInMessage.push(...toolUseBlocks);
          }
          const toolCallsWithStatus = toolCallsInMessage.map(
            (toolCall: any) => {
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
              (tc: any) => tc.id === toolCallId,
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Bot className={styles.logo} />
            <h1 className={styles.title}>Deep Agent</h1>
          </div>
          <div className={styles.headerRight}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewThread}
              disabled={!hasMessages}
            >
              <SquarePen size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleThreadHistory}>
              <History size={20} />
            </Button>
          </div>
        </div>
        <div className={styles.content}>
          <ThreadHistorySidebar
            open={isThreadHistoryOpen}
            setOpen={setIsThreadHistoryOpen}
            currentThreadId={threadId}
            onThreadSelect={handleThreadSelect}
          />
          <div className={styles.messagesContainer}>
            {!hasMessages && !isLoading && !isLoadingThreadState && (
              <div className={styles.emptyState}>
                <Bot size={48} className={styles.emptyIcon} />
                <h2>Start a conversation or select a thread from history</h2>
              </div>
            )}
            {isLoadingThreadState && (
              <div className={styles.threadLoadingState}>
                <LoaderCircle className={styles.threadLoadingSpinner} />
              </div>
            )}
            <div className={styles.messagesList}>
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
                <div className={styles.loadingMessage}>
                  <LoaderCircle className={styles.spinner} />
                  <span>Working...</span>
                </div>
              )}
              {interrupt && debugMode && (
                <div className={styles.debugControls}>
                  <Button
                    onClick={handleContinue}
                    className={styles.continueButton}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleRerunStep}
                    className={styles.rerunButton}
                  >
                    Re-run step
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        <div className={styles.inputContainer}>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className={styles.input}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={styles.debugToggle}>
                      <label htmlFor="debug-mode" className={styles.debugLabel}>
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
                  disabled={!input.trim()}
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

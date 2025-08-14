"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Expand, X, Send, RotateCcw, Loader2 } from "lucide-react";
import * as Diff from 'diff';
import styles from "./OptimizationWindow.module.scss";
import { useStream } from "@langchain/langgraph-sdk/react";
import { createClient, createOptimizerClient } from "@/lib/client";
import { useAuthContext } from "@/providers/Auth";
import { Assistant, type Message } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { assembleOptimizerInputMessage } from "@/app/utils/utils";

type StateType = {
    messages: Message[];
    agent_messages: Message[];
    edited_config: any;
}

type UserMessage = {
    type: "user";
    content: string;
}

type OptimizerMessage = {
    type: "optimizer";
    id: string;
    status: "approved" | "rejected" | "pending";
    old_config: any;
    new_config: any;
}

interface OptimizationWindowProps {
    isExpanded: boolean;
    onToggle: () => void;
    activeAssistant: Assistant | null;
  }

type DisplayMessage = UserMessage | OptimizerMessage;

export const OptimizationWindow = React.memo<OptimizationWindowProps>(({ isExpanded, onToggle, activeAssistant }) => {
  const { session } = useAuthContext();
  const [optimizerThreadId, setOptimizerThreadId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isDiffDialogOpen, setIsDiffDialogOpen] = useState(false);
  const [selectedOptimizerMessage, setSelectedOptimizerMessage] = useState<OptimizerMessage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  
  const deploymentClient = useMemo(() => createClient(session?.accessToken || ""), [session?.accessToken]);
  const optimizerClient = useMemo(() => createOptimizerClient(session?.accessToken || ""), [session?.accessToken]);

  const onFinish = useCallback((state: any) => {
    const optimizerMessage: OptimizerMessage = {
      type: "optimizer",
      id: uuidv4(),
      status: "pending",
      old_config: activeAssistant?.config.configurable || {},
      new_config: state.values.edited_config
    };
    console.log(state.values.edited_config);
    setDisplayMessages(prev => [...prev, optimizerMessage]);
  }, [activeAssistant]);
  
  const stream = useStream<StateType>({
    client: optimizerClient,
    threadId: optimizerThreadId ?? null,
    assistantId: "optimizer",
    onFinish: onFinish,
    onThreadId: setOptimizerThreadId,
    defaultHeaders: {
        "x-auth-scheme": "langsmith",
    },
  });

  const isLoading = stream.isLoading;

  const handleSubmitFeedback = useCallback(() => {
    const messageContent = assembleOptimizerInputMessage(
        activeAssistant?.config || {},
        feedbackInput,
        stream.messages
    );
    setFeedbackInput("");
    setDisplayMessages(prev => [...prev, { type: "user", content: feedbackInput }]);
    const humanMessage: Message = {
        id: uuidv4(),
        type: "human",
        content: messageContent,
    }
    stream.submit({ 
        messages: [humanMessage],
        edited_config: activeAssistant?.config.configurable || {},
        agent_messages: [],
    });
  }, [feedbackInput, stream, activeAssistant]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [feedbackInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  }, [handleSubmitFeedback]);

  const handleClear = useCallback(() => {
    // TODO: Create a new thread
    setFeedbackInput("");
    setDisplayMessages([]);
  }, []);

  const isUserMessage = (message: DisplayMessage): message is UserMessage => {
    return message.type === "user";
  };

  const isOptimizerMessage = (message: DisplayMessage): message is OptimizerMessage => {
    return message.type === "optimizer";
  };

  const handleOptimizerMessageClick = useCallback((message: OptimizerMessage) => {
    setSelectedOptimizerMessage(message);
    setIsDiffDialogOpen(true);
  }, []);

  const handleApprove = useCallback(() => {
    if (selectedOptimizerMessage) {
      setDisplayMessages(prev => 
        prev.map(msg => 
          isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
            ? { ...msg, status: "approved" as const }
            : msg
        )
      );
      if (activeAssistant) {
        deploymentClient.assistants.update(activeAssistant.assistant_id, {
            config: {
                configurable: selectedOptimizerMessage.new_config,
            },
            });
      }
      setIsDiffDialogOpen(false);
      setSelectedOptimizerMessage(null);
    }
  }, [selectedOptimizerMessage]);

  const handleReject = useCallback(() => {
    if (selectedOptimizerMessage) {
      setDisplayMessages(prev => 
        prev.map(msg => 
          isOptimizerMessage(msg) && msg.id === selectedOptimizerMessage.id
            ? { ...msg, status: "rejected" as const }
            : msg
        )
      );
      setIsDiffDialogOpen(false);
      setSelectedOptimizerMessage(null);
    }
  }, [selectedOptimizerMessage]);

  const handleCloseDiffDialog = useCallback(() => {
    setIsDiffDialogOpen(false);
    setSelectedOptimizerMessage(null);
  }, []);

  const createSideBySideDiff = useCallback((oldConfig: any, newConfig: any) => {
    const oldStr = JSON.stringify(oldConfig, null, 2);
    const newStr = JSON.stringify(newConfig, null, 2);
    
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    
    const maxLines = Math.max(oldLines.length, newLines.length);
    const result = [];
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      let oldHighlighted = oldLine;
      let newHighlighted = newLine;
      
      if (oldLine !== newLine) {
        const wordDiff = Diff.diffWords(oldLine, newLine);
        
        oldHighlighted = '';
        newHighlighted = '';
        
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
        hasChanges: oldLine !== newLine
      });
    }
    
    return result;
  }, []);

  return (
    <>
      <div className={`${styles.optimizationWindow} ${isExpanded ? styles.expanded : ""}`}>
        <div className={styles.paneHeader}>
          <button 
            className={styles.toggleButton} 
            onClick={onToggle}
            aria-label={isExpanded ? "Collapse Training Mode" : "Expand Training Mode"}
          >
            <span className={styles.toggleText}>Training Mode</span>
            {isExpanded ? (
              <X size={16} className={styles.toggleIcon} />
            ) : (
              <Expand size={16} className={styles.toggleIcon} />
            )}
          </button>
          {isExpanded && displayMessages.length > 0 && (
            <button 
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear conversation"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        <div className={`${styles.contentWrapper} ${isExpanded ? styles.show : ""}`}>
          <div className={styles.content}>
            <div className={styles.chatContainer}>
              <div className={styles.messagesArea}>
                <div className={styles.messagesScroll}>
                  {displayMessages.map((message, index) => {
                    if (isUserMessage(message)) {
                      return (
                        <div key={`user-${index}`} className={styles.userMessage}>
                          <div className={styles.messageContent}>
                            {message.content}
                          </div>
                        </div>
                      );
                    } else if (isOptimizerMessage(message)) {
                      return (
                        <div key={message.id} className={styles.optimizerMessage}>
                          <button 
                            className={`${styles.optimizerButton} ${styles[message.status]}`}
                            onClick={() => handleOptimizerMessageClick(message)}
                          >
                            <span className={styles.statusIcon}>
                              {message.status === "approved" && "✓"}
                              {message.status === "rejected" && "✗"}
                              {message.status === "pending" && ""}
                            </span>
                            <span className={styles.statusText}>
                              {message.status === "approved" && "Configuration Approved"}
                              {message.status === "rejected" && "Configuration Rejected"}
                              {message.status === "pending" && "Configuration Pending Review"}
                            </span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Loading message with spinner */}
                  {isLoading && (
                    <div className={styles.loadingMessage}>
                      <div className={styles.loadingContent}>
                        <Loader2 size={16} className={styles.spinner} />
                        <span>Analyzing feedback...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.paneFooter}>
            <form className={styles.inputForm} onSubmit={handleSubmitFeedback}>
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

      {/* Diff Dialog */}
      {isDiffDialogOpen && selectedOptimizerMessage && (
        <div className={styles.dialogOverlay} onClick={handleCloseDiffDialog}>
          <div className={styles.diffDialog} onClick={(e) => e.stopPropagation()}>
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
                      {createSideBySideDiff(selectedOptimizerMessage.old_config, selectedOptimizerMessage.new_config)
                        .map((line, index) => (
                          <div 
                            key={`old-${index}`} 
                            className={`${styles.codeLine} ${line.hasChanges ? styles.changedLine : ''}`}
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
                      {createSideBySideDiff(selectedOptimizerMessage.old_config, selectedOptimizerMessage.new_config)
                        .map((line, index) => (
                          <div 
                            key={`new-${index}`} 
                            className={`${styles.codeLine} ${line.hasChanges ? styles.changedLine : ''}`}
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
});

OptimizationWindow.displayName = "OptimizationWindow";
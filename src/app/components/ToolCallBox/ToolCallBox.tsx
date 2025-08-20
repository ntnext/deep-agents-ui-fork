"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ToolCall } from "../../types/types";

interface ToolCallBoxProps {
  toolCall: ToolCall;
}

export const ToolCallBox = React.memo<ToolCallBoxProps>(({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { name, args, result, status } = useMemo(() => {
    const toolName = toolCall.name || "Unknown Tool";
    const toolArgs = toolCall.args || "{}";
    let parsedArgs = {};
    try {
      parsedArgs =
        typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs;
    } catch {
      parsedArgs = { raw: toolArgs };
    }
    const toolResult = toolCall.result || null;
    const toolStatus = toolCall.status || "completed";

    return {
      name: toolName,
      args: parsedArgs,
      result: toolResult,
      status: toolStatus,
    };
  }, [toolCall]);

  const statusIcon = useMemo(() => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-[var(--color-success)] w-[14px] h-[14px]" />;
      case "error":
        return <AlertCircle className="text-[var(--color-error)] w-[14px] h-[14px]" />;
      case "pending":
        return <Loader className="text-[var(--color-primary)] w-[14px] h-[14px] animate-spin" />;
      default:
        return <Terminal className="text-[var(--color-text-secondary)] w-[14px] h-[14px]" />;
    }
  }, [status]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const hasContent = result || Object.keys(args).length > 0;

  return (
    <div className={styles.container}>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className={styles.header}
        disabled={!hasContent}
      >
        <div className={styles.headerLeft}>
          {hasContent && isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          {statusIcon}
          <span className={styles.toolName}>{name}</span>
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div className={styles.content}>
          {Object.keys(args).length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Arguments</h4>
              <pre className={styles.codeBlock}>
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Result</h4>
              <pre className={styles.codeBlock}>
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ToolCallBox.displayName = "ToolCallBox";



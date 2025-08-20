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
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md overflow-hidden w-fit max-w-[70vw]">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="w-full px-4 py-2 flex justify-between items-center gap-2 text-left transition-colors duration-200 hover:not(:disabled):bg-[var(--color-border-light)] disabled:cursor-default"
        disabled={!hasContent}
      >
        <div className="flex items-center gap-2 [&_svg]:flex-shrink-0">
          {hasContent && isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          {statusIcon}
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{name}</span>
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div className="px-4 pb-4 border-t border-[var(--color-border-light)]">
          {Object.keys(args).length > 0 && (
            <div className="mt-4 first:mt-4">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Arguments</h4>
              <pre className="p-2 bg-[var(--color-background)] border border-[var(--color-border-light)] rounded-sm font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all m-0 scrollbar-thin scrollbar-track-[var(--color-border-light)] scrollbar-thumb-[var(--color-text-tertiary)] hover:scrollbar-thumb-[var(--color-text-secondary)] scrollbar-thumb-rounded-sm">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className="mt-4 first:mt-4">
              <h4 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">Result</h4>
              <pre className="p-2 bg-[var(--color-background)] border border-[var(--color-border-light)] rounded-sm font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all m-0 scrollbar-thin scrollbar-track-[var(--color-border-light)] scrollbar-thumb-[var(--color-text-tertiary)] hover:scrollbar-thumb-[var(--color-text-secondary)] scrollbar-thumb-rounded-sm">
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






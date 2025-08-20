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
        return (
          <CheckCircle className="h-[14px] w-[14px] text-[var(--color-success)]" />
        );
      case "error":
        return (
          <AlertCircle className="h-[14px] w-[14px] text-[var(--color-error)]" />
        );
      case "pending":
        return (
          <Loader className="h-[14px] w-[14px] animate-spin text-[var(--color-primary)]" />
        );
      default:
        return (
          <Terminal className="h-[14px] w-[14px] text-[var(--color-text-secondary)]" />
        );
    }
  }, [status]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const hasContent = result || Object.keys(args).length > 0;

  return (
    <div className="w-fit max-w-[70vw] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="hover:not(:disabled):bg-[var(--color-border-light)] flex w-full items-center justify-between gap-2 px-4 py-2 text-left transition-colors duration-200 disabled:cursor-default"
        disabled={!hasContent}
      >
        <div className="flex items-center gap-2 [&_svg]:flex-shrink-0">
          {hasContent && isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          {statusIcon}
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {name}
          </span>
        </div>
      </Button>

      {isExpanded && hasContent && (
        <div className="border-t border-[var(--color-border-light)] px-4 pb-4">
          {Object.keys(args).length > 0 && (
            <div className="mt-4 first:mt-4">
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                Arguments
              </h4>
              <pre className="scrollbar-thin scrollbar-track-[var(--color-border-light)] scrollbar-thumb-[var(--color-text-tertiary)] hover:scrollbar-thumb-[var(--color-text-secondary)] scrollbar-thumb-rounded-sm m-0 overflow-x-auto rounded-sm border border-[var(--color-border-light)] bg-[var(--color-background)] p-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className="mt-4 first:mt-4">
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                Result
              </h4>
              <pre className="scrollbar-thin scrollbar-track-[var(--color-border-light)] scrollbar-thumb-[var(--color-text-tertiary)] hover:scrollbar-thumb-[var(--color-text-secondary)] scrollbar-thumb-rounded-sm m-0 overflow-x-auto rounded-sm border border-[var(--color-border-light)] bg-[var(--color-background)] p-2 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
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

"use client";

import React, { useMemo } from "react";
import { X, Bot, CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownContent } from "../MarkdownContent/MarkdownContent";
import type { SubAgent } from "../../types/types";

interface SubAgentPanelProps {
  subAgent: SubAgent;
  onClose: () => void;
}

const SubAgentPanelComponent = ({ subAgent, onClose }: SubAgentPanelProps) => {
  const statusIcon = useMemo(() => {
    switch (subAgent.status) {
      case "completed":
        return <CheckCircle className="text-[var(--color-success)]" />;
      case "error":
        return <AlertCircle className="text-[var(--color-error)]" />;
      case "pending":
        return <Loader className="animate-spin text-[var(--color-primary)]" />;
      default:
        return <Clock className="text-[var(--color-text-tertiary)]" />;
    }
  }, [subAgent.status]);

  const statusText = useMemo(() => {
    switch (subAgent.status) {
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      case "active":
        return "Running";
      default:
        return "Pending";
    }
  }, [subAgent.status]);

  return (
    <div className="absolute top-0 right-0 z-10 flex h-full w-96 flex-col border-l border-[var(--color-border)] bg-[var(--color-background)] shadow-lg">
      <div className="flex items-start justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-1 gap-2">
          <Bot className="h-8 w-8 flex-shrink-0 text-[var(--color-secondary)]" />
          <div>
            <h3 className="m-0 mb-1 text-lg font-semibold">
              {subAgent.subAgentName}
            </h3>
            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] [&_svg]:h-[14px] [&_svg]:w-[14px]">
              {statusIcon}
              <span>{statusText}</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 hover:bg-[var(--color-border-light)]"
        >
          <X size={20} />
        </Button>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="mb-12 last:mb-0">
            <h4 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
              Input
            </h4>
            <div className="rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 [&_.markdown-content]:text-sm [&_.markdown-content]:leading-relaxed [&_.markdown-content_code]:rounded-sm [&_.markdown-content_code]:bg-[var(--color-background)] [&_.markdown-content_code]:px-1 [&_.markdown-content_code]:py-0.5 [&_.markdown-content_code]:text-xs [&_.markdown-content_h1]:mt-0 [&_.markdown-content_h1]:mb-2 [&_.markdown-content_h2]:mt-0 [&_.markdown-content_h2]:mb-2 [&_.markdown-content_h3]:mt-0 [&_.markdown-content_h3]:mb-2 [&_.markdown-content_h4]:mt-0 [&_.markdown-content_h4]:mb-2 [&_.markdown-content_h5]:mt-0 [&_.markdown-content_h5]:mb-2 [&_.markdown-content_h6]:mt-0 [&_.markdown-content_h6]:mb-2 [&_.markdown-content_li]:mb-1 [&_.markdown-content_ol]:mb-2 [&_.markdown-content_ol]:pl-6 [&_.markdown-content_p]:mb-2 [&_.markdown-content_p:last-child]:mb-0 [&_.markdown-content_pre]:overflow-x-auto [&_.markdown-content_pre]:rounded-sm [&_.markdown-content_pre]:bg-[var(--color-background)] [&_.markdown-content_pre]:p-2 [&_.markdown-content_pre]:text-xs [&_.markdown-content_ul]:mb-2 [&_.markdown-content_ul]:pl-6">
              <MarkdownContent
                content={
                  typeof subAgent.input === "string"
                    ? subAgent.input
                    : subAgent.input.description &&
                        typeof subAgent.input.description === "string"
                      ? subAgent.input.description
                      : subAgent.input.prompt &&
                          typeof subAgent.input.prompt === "string"
                        ? subAgent.input.prompt
                        : JSON.stringify(subAgent.input, null, 2)
                }
              />
            </div>
          </div>
          {subAgent.output && (
            <div className="mb-12 last:mb-0">
              <h4 className="mb-2 text-xs font-semibold tracking-wider text-[var(--color-text-secondary)] uppercase">
                Output
              </h4>
              <div className="rounded-md border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 [&_.markdown-content]:text-sm [&_.markdown-content]:leading-relaxed [&_.markdown-content_code]:rounded-sm [&_.markdown-content_code]:bg-[var(--color-background)] [&_.markdown-content_code]:px-1 [&_.markdown-content_code]:py-0.5 [&_.markdown-content_code]:text-xs [&_.markdown-content_h1]:mt-0 [&_.markdown-content_h1]:mb-2 [&_.markdown-content_h2]:mt-0 [&_.markdown-content_h2]:mb-2 [&_.markdown-content_h3]:mt-0 [&_.markdown-content_h3]:mb-2 [&_.markdown-content_h4]:mt-0 [&_.markdown-content_h4]:mb-2 [&_.markdown-content_h5]:mt-0 [&_.markdown-content_h5]:mb-2 [&_.markdown-content_h6]:mt-0 [&_.markdown-content_h6]:mb-2 [&_.markdown-content_li]:mb-1 [&_.markdown-content_ol]:mb-2 [&_.markdown-content_ol]:pl-6 [&_.markdown-content_p]:mb-2 [&_.markdown-content_p:last-child]:mb-0 [&_.markdown-content_pre]:overflow-x-auto [&_.markdown-content_pre]:rounded-sm [&_.markdown-content_pre]:bg-[var(--color-background)] [&_.markdown-content_pre]:p-2 [&_.markdown-content_pre]:text-xs [&_.markdown-content_ul]:mb-2 [&_.markdown-content_ul]:pl-6">
                <MarkdownContent
                  content={
                    typeof subAgent.output === "string"
                      ? subAgent.output
                      : subAgent.output.result &&
                          typeof subAgent.output.result === "string"
                        ? subAgent.output.result
                        : JSON.stringify(subAgent.output, null, 2)
                  }
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const SubAgentPanel = React.memo(
  SubAgentPanelComponent,
  (prevProps, nextProps) => {
    const inputEqual =
      JSON.stringify(prevProps.subAgent.input) ===
      JSON.stringify(nextProps.subAgent.input);
    const outputEqual =
      JSON.stringify(prevProps.subAgent.output) ===
      JSON.stringify(nextProps.subAgent.output);
    return (
      inputEqual &&
      outputEqual &&
      prevProps.subAgent.status === nextProps.subAgent.status &&
      prevProps.subAgent.id === nextProps.subAgent.id &&
      prevProps.onClose === nextProps.onClose
    );
  },
);

SubAgentPanel.displayName = "SubAgentPanel";

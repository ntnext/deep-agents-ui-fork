"use client";

import React, { useMemo } from "react";
import { X, Bot, CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownContent } from "../MarkdownContent/MarkdownContent";
import type { SubAgent } from "../../types/types";
import { cn } from "@/lib/utils";

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
        return <Loader className="text-[var(--color-primary)] animate-spin" />;
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
    <div className="w-96 h-full bg-[var(--color-background)] border-l border-[var(--color-border)] flex flex-col absolute right-0 top-0 z-10 shadow-lg">
      <div className="flex justify-between items-start p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex gap-2 flex-1">
          <Bot className="w-8 h-8 text-[var(--color-secondary)] flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold m-0 mb-1">{subAgent.subAgentName}</h3>
            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] [&_svg]:w-[14px] [&_svg]:h-[14px]">
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

      <ScrollArea className={styles.messages}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Input</h4>
            <div className={styles.sectionContent}>
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
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Output</h4>
              <div className={styles.sectionContent}>
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




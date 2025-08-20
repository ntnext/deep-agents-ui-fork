"use client";

import React from "react";
import { CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import type { SubAgent } from "../../types/types";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick }) => {
    const getStatusIcon = () => {
      switch (subAgent.status) {
        case "completed":
          return (
            <CheckCircle className="h-[14px] w-[14px] flex-shrink-0 text-[var(--color-success)]" />
          );
        case "error":
          return (
            <AlertCircle className="h-[14px] w-[14px] flex-shrink-0 text-[var(--color-error)]" />
          );
        case "pending":
          return (
            <Loader className="h-[14px] w-[14px] flex-shrink-0 animate-spin text-[var(--color-primary)]" />
          );
        default:
          return (
            <Clock className="h-[14px] w-[14px] flex-shrink-0 text-[var(--color-text-tertiary)]" />
          );
      }
    };

    return (
      <button
        onClick={onClick}
        className="flex w-full cursor-pointer items-start gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-avatar-bg)] p-4 pl-6 text-left transition-all duration-200 hover:translate-x-0.5 hover:bg-[var(--color-subagent-hover)] hover:shadow-lg active:translate-x-0"
        aria-label={`View ${subAgent.name} details`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-start gap-2">
            {getStatusIcon()}
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">
              {subAgent.subAgentName}
            </span>
          </div>
          <p className="m-0 line-clamp-2 overflow-hidden text-xs leading-normal text-[var(--color-text-secondary)]">
            {typeof subAgent.input === "string"
              ? subAgent.input
              : subAgent.input.description &&
                  typeof subAgent.input.description === "string"
                ? subAgent.input.description
                : JSON.stringify(subAgent.input)}
          </p>
        </div>
      </button>
    );
  },
);

SubAgentIndicator.displayName = "SubAgentIndicator";

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
          return <CheckCircle className="text-[var(--color-success)] w-[14px] h-[14px] flex-shrink-0" />;
        case "error":
          return <AlertCircle className="text-[var(--color-error)] w-[14px] h-[14px] flex-shrink-0" />;
        case "pending":
          return <Loader className="text-[var(--color-primary)] w-[14px] h-[14px] flex-shrink-0 animate-spin" />;
        default:
          return <Clock className="text-[var(--color-text-tertiary)] w-[14px] h-[14px] flex-shrink-0" />;
      }
    };

    return (
      <button
        onClick={onClick}
        className="flex items-start gap-4 w-full p-4 pl-6 bg-[var(--color-avatar-bg)] border border-[var(--color-border)] rounded-md text-left transition-all duration-200 cursor-pointer hover:bg-[var(--color-subagent-hover)] hover:translate-x-0.5 hover:shadow-lg active:translate-x-0"
        aria-label={`View ${subAgent.name} details`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-start gap-2">
            {getStatusIcon()}
            <span className="text-lg font-semibold text-[var(--color-text-primary)]">{subAgent.subAgentName}</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-normal m-0 overflow-hidden line-clamp-2">
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





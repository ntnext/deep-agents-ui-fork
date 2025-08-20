"use client";

import React from "react";
import { CheckCircle, AlertCircle, Clock, Loader } from "lucide-react";
import type { SubAgent } from "../../types/types";
import { cn } from "@/lib/utils";

interface SubAgentIndicatorProps {
  subAgent: SubAgent;
  onClick: () => void;
}

export const SubAgentIndicator = React.memo<SubAgentIndicatorProps>(
  ({ subAgent, onClick }) => {
    const getStatusIcon = () => {
      switch (subAgent.status) {
        case "completed":
          return <CheckCircle className={styles.statusCompleted} />;
        case "error":
          return <AlertCircle className={styles.statusError} />;
        case "pending":
          return <Loader className={styles.statusActive} />;
        default:
          return <Clock className={styles.statusPending} />;
      }
    };

    return (
      <button
        onClick={onClick}
        className={styles.container}
        aria-label={`View ${subAgent.name} details`}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            {getStatusIcon()}
            <span className={styles.name}>{subAgent.subAgentName}</span>
          </div>
          <p className={styles.description}>
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


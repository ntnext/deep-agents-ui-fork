"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useEnvConfig } from "@/providers/EnvConfig";
import { cn } from "@/lib/utils";

interface EnvConfig {
  DEPLOYMENT_URL: string;
  ASSISTANT_ID: string;
  LANGSMITH_API_KEY: string;
}

const REQUIRED_KEYS: Array<keyof EnvConfig> = [
  "DEPLOYMENT_URL",
  "ASSISTANT_ID",
];

const OPTIONAL_KEYS: Array<keyof EnvConfig> = ["LANGSMITH_API_KEY"];

const ENV_KEYS: Array<keyof EnvConfig> = [...REQUIRED_KEYS, ...OPTIONAL_KEYS];

const ENV_LABELS: Record<keyof EnvConfig, string> = {
  DEPLOYMENT_URL: "Agent Deployment URL",
  ASSISTANT_ID: "Assistant ID",
  LANGSMITH_API_KEY: "LangSmith API Key",
};

const ENV_PLACEHOLDERS: Record<keyof EnvConfig, string> = {
  DEPLOYMENT_URL: "http://127.0.0.1:2024 for locally running agents",
  ASSISTANT_ID: "ex. asdfasdf-asdf-asdf-asdf-asdfasdfasdf",
  LANGSMITH_API_KEY: "Optional, not necessary for locally running agents",
};

interface EnvConfigDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  isSettings?: boolean;
}

export const EnvConfigDialog: React.FC<EnvConfigDialogProps> = ({
  isOpen,
  onClose,
  isSettings = false,
}) => {
  const { updateConfig } = useEnvConfig();
  const [config, setConfig] = useState<EnvConfig>({
    DEPLOYMENT_URL: "",
    ASSISTANT_ID: "",
    LANGSMITH_API_KEY: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof EnvConfig, boolean>>
  >({});

  useEffect(() => {
    const loadedConfig: Partial<EnvConfig> = {};
    ENV_KEYS.forEach((key) => {
      const storedValue = localStorage.getItem(key);
      loadedConfig[key] = storedValue || "";
    });
    setConfig(loadedConfig as EnvConfig);
  }, [isOpen]);

  const validateConfig = (): boolean => {
    const newErrors: Partial<Record<keyof EnvConfig, boolean>> = {};
    let hasErrors = false;

    REQUIRED_KEYS.forEach((key) => {
      if (!config[key] || config[key].trim() === "") {
        newErrors[key] = true;
        hasErrors = true;
      }
    });
    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSave = () => {
    if (!validateConfig()) {
      return;
    }
    updateConfig(config);
    if (onClose) {
      onClose();
    }
  };

  const handleInputChange = (key: keyof EnvConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const canClose =
    isSettings ||
    REQUIRED_KEYS.every((key) => {
      const storedValue = localStorage.getItem(key);
      return storedValue;
    });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={canClose ? onClose : undefined}
    >
      <DialogContent
        className="max-w-[600px] w-[600px] max-h-[80vh] flex flex-col bg-[var(--color-background)] p-6"
        showCloseButton={canClose}
        onInteractOutside={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!canClose) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex flex-col gap-2 pb-4 mb-4 border-b border-[var(--color-border)]">
          <DialogTitle className="sr-only">
            Deep Agent Configuration
          </DialogTitle>
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0" />
            <span className="text-lg font-semibold text-[var(--color-text-primary)] overflow-hidden text-ellipsis whitespace-nowrap">Deep Agent Configuration</span>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] m-0 leading-normal">
            {isSettings
              ? "Update your agent configuration settings"
              : "Please configure the required variables to continue"}
          </p>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto py-2">
          {ENV_KEYS.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-2"
            >
              <label
                htmlFor={key}
                className="text-sm font-medium"
              >
                {ENV_LABELS[key]}
                {!isSettings && REQUIRED_KEYS.includes(key) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              <input
                id={key}
                type="text"
                value={config[key]}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={ENV_PLACEHOLDERS[key]}
                className={cn(
                  "w-full text-sm rounded-sm px-4 py-2 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] transition-all duration-200 font-sans placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-background)] hover:not(:focus):border-[var(--color-text-secondary)]",
                  errors[key] && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]"
                )}
              />
              {errors[key] && (
                <span className="text-xs text-red-500 mt-1">
                  This field is required
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[var(--color-border)] flex-shrink-0">
          {isSettings && (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-1 hover:bg-[var(--color-border-light)]"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-1 bg-[var(--color-primary)] text-white transition-colors duration-200 hover:bg-[#164545]"
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};





"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useEnvConfig } from "@/providers/EnvConfig";
import styles from "./EnvConfigDialog.module.scss";

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
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent
        className={styles.dialog}
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
        <div className={styles.header}>
          <DialogTitle className="sr-only">
            Deep Agent Configuration
          </DialogTitle>
          <div className={styles.titleSection}>
            <Settings className={styles.settingsIcon} />
            <span className={styles.dialogTitle}>Deep Agent Configuration</span>
          </div>
          <p className={styles.description}>
            {isSettings
              ? "Update your agent configuration settings"
              : "Please configure the required variables to continue"}
          </p>
        </div>
        <div className={styles.form}>
          {ENV_KEYS.map((key) => (
            <div key={key} className={styles.formGroup}>
              <label htmlFor={key} className={styles.label}>
                {ENV_LABELS[key]}
                {!isSettings && REQUIRED_KEYS.includes(key) && (
                  <span className={styles.required}>*</span>
                )}
              </label>
              <input
                id={key}
                type="text"
                value={config[key]}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder={ENV_PLACEHOLDERS[key]}
                className={`${styles.input} ${errors[key] ? styles.error : ""}`}
              />
              {errors[key] && (
                <span className={styles.errorMessage}>
                  This field is required
                </span>
              )}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          {isSettings && (
            <Button
              variant="outline"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} className={styles.saveButton}>
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

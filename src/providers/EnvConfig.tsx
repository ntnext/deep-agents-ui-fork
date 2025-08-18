"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EnvConfigDialog } from "@/app/components/EnvConfigDialog/EnvConfigDialog";

interface EnvConfig {
  DEPLOYMENT_URL: string;
  AGENT_ID: string;
  ASSISTANT_ID: string;
  LANGSMITH_API_KEY: string;
}

interface EnvConfigContextType {
  config: EnvConfig | null;
  isConfigured: boolean;
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  getEnvValue: (key: keyof EnvConfig) => string | undefined;
}

const EnvConfigContext = createContext<EnvConfigContextType | undefined>(
  undefined,
);

const REQUIRED_KEYS: Array<keyof EnvConfig> = [
  "DEPLOYMENT_URL",
  "AGENT_ID",
  "ASSISTANT_ID",
];

const OPTIONAL_KEYS: Array<keyof EnvConfig> = ["LANGSMITH_API_KEY"];

const ENV_KEYS: Array<keyof EnvConfig> = [...REQUIRED_KEYS, ...OPTIONAL_KEYS];

export const EnvConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<EnvConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConfiguration = () => {
      const loadedConfig: Partial<EnvConfig> = {};
      let allConfigured = true;

      ENV_KEYS.forEach((key) => {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          loadedConfig[key] = storedValue;
        }
      });

      REQUIRED_KEYS.forEach((key) => {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) {
          allConfigured = false;
        }
      });

      if (allConfigured) {
        setConfig(loadedConfig as EnvConfig);
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }

      setIsChecking(false);
    };

    checkConfiguration();

    const handleStorageChange = () => {
      checkConfiguration();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getEnvValue = (key: keyof EnvConfig): string | undefined => {
    return localStorage.getItem(key) || undefined;
  };

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  if (isChecking) {
    return null;
  }

  return (
    <EnvConfigContext.Provider
      value={{
        config,
        isConfigured,
        showSettings,
        openSettings,
        closeSettings,
        getEnvValue,
      }}
    >
      {children}
      <EnvConfigDialog
        isOpen={!isConfigured || showSettings}
        onClose={isConfigured ? closeSettings : undefined}
        isSettings={isConfigured && showSettings}
      />
    </EnvConfigContext.Provider>
  );
};

export const useEnvConfig = () => {
  const context = useContext(EnvConfigContext);
  if (!context) {
    throw new Error("useEnvConfig must be used within an EnvConfigProvider");
  }
  return context;
};

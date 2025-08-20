"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { EnvConfigDialog } from "@/app/components/EnvConfigDialog/EnvConfigDialog";

interface EnvConfig {
  DEPLOYMENT_URL: string;
  ASSISTANT_ID: string;
  LANGSMITH_API_KEY: string;
}

export const ENV_CONFIG_KEYS = {
  DEPLOYMENT_URL: "DEPLOYMENT_URL",
  ASSISTANT_ID: "ASSISTANT_ID",
  LANGSMITH_API_KEY: "LANGSMITH_API_KEY",
} as const satisfies Record<keyof EnvConfig, keyof EnvConfig>;

interface EnvConfigContextType {
  config: EnvConfig | null;
  isConfigured: boolean;
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  getEnvValue: (key: keyof EnvConfig) => string | undefined;
  getLangSmithApiKey: () => string;
}

const EnvConfigContext = createContext<EnvConfigContextType | undefined>(
  undefined,
);

const REQUIRED_KEYS: Array<keyof EnvConfig> = [
  "DEPLOYMENT_URL",
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

  const checkConfiguration = useCallback(() => {
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
  }, []);

  useEffect(() => {
    checkConfiguration();
  }, [checkConfiguration]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && ENV_KEYS.includes(e.key as keyof EnvConfig)) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          checkConfiguration();
        }, 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [checkConfiguration]);

  const getEnvValue = useCallback((key: keyof EnvConfig): string | undefined => {
    return localStorage.getItem(key) || undefined;
  }, []);

  const getLangSmithApiKey = useCallback(() => {
    // NOTE: Need to return a non-falsy value for the api key
    return localStorage.getItem("LANGSMITH_API_KEY") || "filler-token";
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  const contextValue = useMemo(
    () => ({
      config,
      isConfigured,
      showSettings,
      openSettings,
      closeSettings,
      getEnvValue,
      getLangSmithApiKey,
    }),
    [config, isConfigured, showSettings, openSettings, closeSettings, getEnvValue, getLangSmithApiKey]
  );

  if (isChecking) {
    return null;
  }

  return (
    <EnvConfigContext.Provider value={contextValue}>
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

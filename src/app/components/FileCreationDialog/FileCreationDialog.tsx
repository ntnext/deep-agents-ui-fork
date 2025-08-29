"use client";

import React, { useState, useCallback } from "react";
import { FileText, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FileCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string, content: string) => void;
}

export const FileCreationDialog = React.memo<FileCreationDialogProps>(
  ({ isOpen, onClose, onCreateFile }) => {
    const [fileName, setFileName] = useState("");
    const [fileContent, setFileContent] = useState("");

    const handleSubmit = useCallback(() => {
      if (fileName.trim()) {
        onCreateFile(fileName.trim(), fileContent);
        setFileName("");
        setFileContent("");
        onClose();
      }
    }, [fileName, fileContent, onCreateFile, onClose]);

    const handleCancel = useCallback(() => {
      setFileName("");
      setFileContent("");
      onClose();
    }, [onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleSubmit();
      }
    }, [handleSubmit]);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="flex max-h-[80vh] flex-col bg-[var(--color-background)]"
          style={{
            padding: "1.5rem",
            width: "60vw",
            maxWidth: "60vw",
          }}
        >
          <DialogTitle className="sr-only">Create New File</DialogTitle>
          <div
            className="flex items-center justify-between border-b border-[var(--color-border)]"
            style={{ gap: "1rem", paddingBottom: "1rem", marginBottom: "1rem" }}
          >
            <div
              className="flex min-w-0 items-center"
              style={{ gap: "0.5rem" }}
            >
              <FileText className="h-5 w-5 shrink-0 text-[var(--color-text-secondary)]" />
              <span className="text-base font-medium text-[var(--color-text-primary)]">
                Create New File
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label 
                htmlFor="fileName"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.5rem"
                }}
              >
                File Name
              </label>
              <Input
                id="fileName"
                type="text"
                placeholder="e.g., README.md, config.json, script.py"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label 
                htmlFor="fileContent"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.5rem"
                }}
              >
                Content
              </label>
              <Textarea
                id="fileContent"
                placeholder="Type your file content here... (supports Markdown)"
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                  minHeight: "300px",
                  resize: "vertical"
                }}
              />
            </div>

            <div 
              style={{ 
                display: "flex", 
                gap: "0.5rem", 
                justifyContent: "flex-end",
                paddingTop: "1rem",
                borderTop: "1px solid var(--color-border)"
              }}
            >
              <Button
                variant="outline"
                onClick={handleCancel}
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!fileName.trim()}
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "white",
                  opacity: fileName.trim() ? 1 : 0.5,
                }}
              >
                <Plus size={16} style={{ marginRight: "0.25rem" }} />
                Create File
              </Button>
            </div>
          </div>

          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-tertiary)",
              marginTop: "0.5rem",
              textAlign: "center"
            }}
          >
            Tip: Press Ctrl+Enter to create the file quickly
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);

FileCreationDialog.displayName = "FileCreationDialog";
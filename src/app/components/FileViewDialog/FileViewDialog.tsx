"use client";

import React, { useMemo, useCallback } from "react";
import { FileText, Copy, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MarkdownContent } from "../MarkdownContent/MarkdownContent";
import type { FileItem } from "../../types/types";

interface FileViewDialogProps {
  file: FileItem;
  onClose: () => void;
}

export const FileViewDialog = React.memo<FileViewDialogProps>(
  ({ file, onClose }) => {
    const fileExtension = useMemo(() => {
      return file.path.split(".").pop()?.toLowerCase() || "";
    }, [file.path]);

    const isMarkdown = useMemo(() => {
      return fileExtension === "md" || fileExtension === "markdown";
    }, [fileExtension]);

    const language = useMemo(() => {
      const languageMap: Record<string, string> = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        rb: "ruby",
        go: "go",
        rs: "rust",
        java: "java",
        cpp: "cpp",
        c: "c",
        cs: "csharp",
        php: "php",
        swift: "swift",
        kt: "kotlin",
        scala: "scala",
        sh: "bash",
        bash: "bash",
        zsh: "bash",
        json: "json",
        xml: "xml",
        html: "html",
        css: "css",
        scss: "scss",
        sass: "sass",
        less: "less",
        sql: "sql",
        yaml: "yaml",
        yml: "yaml",
        toml: "toml",
        ini: "ini",
        dockerfile: "dockerfile",
        makefile: "makefile",
      };
      return languageMap[fileExtension] || "text";
    }, [fileExtension]);

    const handleCopy = useCallback(() => {
      if (file.content) {
        navigator.clipboard.writeText(file.content);
      }
    }, [file.content]);

    const handleDownload = useCallback(() => {
      if (file.content) {
        const blob = new Blob([file.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.path;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, [file.content, file.path]);

    return (
      <Dialog
        open={true}
        onOpenChange={onClose}
      >
        <DialogContent className="flex max-h-[80vh] w-[900px] max-w-[80vw] flex-col bg-[var(--color-background)] p-6">
          <DialogTitle className="sr-only">{file.path}</DialogTitle>
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-5 w-5 flex-shrink-0 text-[var(--color-text-secondary)]" />
              <span className="overflow-hidden text-base font-medium text-ellipsis whitespace-nowrap text-[var(--color-text-primary)]">
                {file.path}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="mr-1 flex items-center gap-1 px-2 py-1 hover:bg-[var(--color-border-light)]"
              >
                <Copy size={16} />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="mr-1 flex items-center gap-1 px-2 py-1 hover:bg-[var(--color-border-light)]"
              >
                <Download size={16} />
                Download
              </Button>
            </div>
          </div>

          <ScrollArea className="scrollbar-thin scrollbar-w-2 scrollbar-h-2 scrollbar-track-[var(--color-border-light)] scrollbar-track-rounded-sm scrollbar-thumb-[var(--color-text-tertiary)] scrollbar-thumb-rounded-sm hover:scrollbar-thumb-[var(--color-text-secondary)] max-h-[60vh] flex-1 overflow-auto rounded-md bg-[var(--color-surface)] p-4">
            {file.content ? (
              isMarkdown ? (
                <div className="rounded-md bg-[var(--color-background)] p-6">
                  <MarkdownContent content={file.content} />
                </div>
              ) : (
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                  showLineNumbers
                >
                  {file.content}
                </SyntaxHighlighter>
              )
            ) : (
              <div className="flex items-center justify-center p-16 text-[var(--color-text-tertiary)]">
                <p className="m-0 text-sm">File is empty</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  },
);

FileViewDialog.displayName = "FileViewDialog";

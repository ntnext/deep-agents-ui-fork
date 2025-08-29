"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, X, FileText } from "lucide-react";
import type { FileItem } from "../../types/types";

interface FileEditorProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: FileItem) => void;
}

export const FileEditor = React.memo<FileEditorProps>(
  ({ file, isOpen, onClose, onSave }) => {
    const [editedContent, setEditedContent] = useState("");
    const [editedPath, setEditedPath] = useState("");

    React.useEffect(() => {
      if (file) {
        setEditedContent(file.content);
        setEditedPath(file.path);
      }
    }, [file]);

    const handleSave = useCallback(() => {
      if (file) {
        const updatedFile: FileItem = {
          path: editedPath,
          content: editedContent,
        };
        onSave(updatedFile);
        onClose();
      }
    }, [file, editedPath, editedContent, onSave, onClose]);

    const handleClose = useCallback(() => {
      onClose();
      // Reset form
      if (file) {
        setEditedContent(file.content);
        setEditedPath(file.path);
      }
    }, [file, onClose]);

    if (!file) return null;

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Edit File
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* File Path Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                File Path:
              </label>
              <Input
                value={editedPath}
                onChange={(e) => setEditedPath(e.target.value)}
                placeholder="Enter file path..."
                className="font-mono text-sm"
              />
            </div>

            {/* Content Editor */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <label className="text-sm font-medium text-gray-700">
                Content:
              </label>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter file content..."
                className="flex-1 min-h-[400px] font-mono text-sm resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 flex-shrink-0">
              <Button variant="outline" onClick={handleClose}>
                <X size={16} className="mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

FileEditor.displayName = "FileEditor";
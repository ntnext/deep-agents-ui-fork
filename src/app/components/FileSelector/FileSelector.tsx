"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Folder,
  Upload,
  X,
  Plus,
  Edit3,
  FolderOpen,
} from "lucide-react";
import type { FileItem } from "../../types/types";

interface FileSelectorProps {
  selectedFiles: FileItem[];
  onFileSelect: (files: FileItem[]) => void;
  onFileEdit: (file: FileItem) => void;
  onFileRemove: (filePath: string) => void;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  content?: string;
}

export const FileSelector = React.memo<FileSelectorProps>(
  ({ selectedFiles, onFileSelect, onFileEdit, onFileRemove }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState("/");
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [isCreatingFile, setIsCreatingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadDirectory = useCallback(async (path: string) => {
      setIsLoading(true);
      try {
        // Create a more comprehensive mock file tree based on typical React/Next.js project structure
        const createProjectStructure = (basePath: string = ""): FileNode[] => {
          if (basePath === "" || basePath === "/") {
            return [
              {
                name: "src",
                path: "/src",
                type: "directory",
                children: createProjectStructure("/src"),
              },
              {
                name: "public",
                path: "/public",
                type: "directory",
                children: [
                  {
                    name: "favicon.ico",
                    path: "/public/favicon.ico",
                    type: "file",
                    content: "// Favicon file",
                  },
                ],
              },
              {
                name: "README.md",
                path: "/README.md",
                type: "file",
                content: "# My Project\n\nThis is a sample project for demonstrating file selection functionality.",
              },
              {
                name: "package.json",
                path: "/package.json",
                type: "file",
                content: `{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
              },
              {
                name: "tsconfig.json",
                path: "/tsconfig.json",
                type: "file",
                content: `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}`,
              },
            ];
          } else if (basePath === "/src") {
            return [
              {
                name: "app",
                path: "/src/app",
                type: "directory",
                children: createProjectStructure("/src/app"),
              },
              {
                name: "components",
                path: "/src/components",
                type: "directory",
                children: [
                  {
                    name: "ui",
                    path: "/src/components/ui",
                    type: "directory",
                  },
                  {
                    name: "Header.tsx",
                    path: "/src/components/Header.tsx",
                    type: "file",
                    content: `import React from 'react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
};`,
                  },
                ],
              },
              {
                name: "lib",
                path: "/src/lib",
                type: "directory",
                children: [
                  {
                    name: "utils.ts",
                    path: "/src/lib/utils.ts",
                    type: "file",
                    content: `export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date) {
  return date.toLocaleDateString();
}`,
                  },
                ],
              },
            ];
          } else if (basePath === "/src/app") {
            return [
              {
                name: "page.tsx",
                path: "/src/app/page.tsx",
                type: "file",
                content: `import React from 'react';
import { Header } from '@/components/Header';

export default function HomePage() {
  return (
    <div>
      <Header title="Welcome to My App" />
      <main className="p-4">
        <h2>Home Page Content</h2>
        <p>This is the main page of the application.</p>
      </main>
    </div>
  );
}`,
              },
              {
                name: "layout.tsx",
                path: "/src/app/layout.tsx",
                type: "file",
                content: `import React from 'react';
import './globals.css';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
              },
              {
                name: "globals.css",
                path: "/src/app/globals.css",
                type: "file",
                content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  margin: 0;
  padding: 0;
}`,
              },
            ];
          }
          return [];
        };

        const files = createProjectStructure(path);
        setFileTree(files);
      } catch (error) {
        console.error("Failed to load directory:", error);
      } finally {
        setIsLoading(false);
      }
    }, []);

    const handleFileSelect = useCallback(
      (file: FileNode) => {
        if (file.type === "file" && file.content !== undefined) {
          const newFile: FileItem = {
            path: file.path,
            content: file.content,
          };
          
          // Check if file is already selected
          const isAlreadySelected = selectedFiles.some(
            (f) => f.path === newFile.path
          );
          
          if (!isAlreadySelected) {
            onFileSelect([...selectedFiles, newFile]);
          }
        }
      },
      [selectedFiles, onFileSelect]
    );

    const handleDirectoryClick = useCallback(
      (directory: FileNode) => {
        if (directory.type === "directory") {
          setCurrentPath(directory.path);
          // In a real implementation, you'd load the directory contents
          loadDirectory(directory.path);
        }
      },
      [loadDirectory]
    );

    const handleFileUpload = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            const newFile: FileItem = {
              path: `/${file.name}`,
              content,
            };
            
            const isAlreadySelected = selectedFiles.some(
              (f) => f.path === newFile.path
            );
            
            if (!isAlreadySelected) {
              onFileSelect([...selectedFiles, newFile]);
            }
          };
          reader.readAsText(file);
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      [selectedFiles, onFileSelect]
    );

    const handleCreateFile = useCallback(() => {
      if (newFileName.trim()) {
        const newFile: FileItem = {
          path: `${currentPath}/${newFileName}`,
          content: "",
        };
        onFileSelect([...selectedFiles, newFile]);
        setNewFileName("");
        setIsCreatingFile(false);
      }
    }, [newFileName, currentPath, selectedFiles, onFileSelect]);

    const renderFileTree = (nodes: FileNode[], depth = 0) => {
      return nodes.map((node) => (
        <div key={node.path} style={{ marginLeft: `${depth * 16}px` }}>
          <div
            onClick={() =>
              node.type === "directory"
                ? handleDirectoryClick(node)
                : handleFileSelect(node)
            }
            className="flex items-center gap-2 p-2 cursor-pointer rounded transition-colors hover:bg-muted"
          >
            {node.type === "directory" ? (
              <FolderOpen size={16} className="text-primary" />
            ) : (
              <FileText size={16} className="text-muted-foreground" />
            )}
            <span className="text-sm">{node.name}</span>
          </div>
          {node.children && renderFileTree(node.children, depth + 1)}
        </div>
      ));
    };

    React.useEffect(() => {
      if (isOpen) {
        loadDirectory(currentPath);
      }
    }, [isOpen, currentPath, loadDirectory]);

    return (
      <div className="flex flex-col gap-2">
        {/* Selected Files Display */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-1 bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs"
              >
                <FileText size={12} className="text-primary" />
                <span className="max-w-20 truncate">{file.path.split("/").pop()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileEdit(file)}
                  className="h-4 w-4 p-0 hover:bg-primary/20"
                >
                  <Edit3 size={10} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(file.path)}
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                >
                  <X size={10} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* File Selection Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Select Files</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {/* File Upload */}
              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload Files
                </Button>
                
                {/* Create New File */}
                {isCreatingFile ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="filename.ext"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      className="w-40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFile();
                        } else if (e.key === "Escape") {
                          setIsCreatingFile(false);
                          setNewFileName("");
                        }
                      }}
                      autoFocus
                    />
                    <Button onClick={handleCreateFile} size="sm">
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCreatingFile(false);
                        setNewFileName("");
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingFile(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    New File
                  </Button>
                )}
              </div>

              {/* File Browser */}
              <div className="border rounded-lg">
                <div className="p-2 border-b bg-muted/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Folder size={16} />
                    <span>{currentPath}</span>
                  </div>
                </div>
                <ScrollArea className="h-64">
                  <div className="p-2">
                    {isLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      renderFileTree(fileTree)
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="text-xs text-muted-foreground">
                Click files to select them, or upload from your computer.
                Selected files will be included in your message to the agent.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

FileSelector.displayName = "FileSelector";
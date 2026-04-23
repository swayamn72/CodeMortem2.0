"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  cpp: "cpp",
  c: "c",
  python: "python",
  java: "java",
  go: "go",
  javascript: "javascript",
  rust: "rust",
};

export default function CodeEditor({ value, language, onChange, readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleChange = useCallback(
    (val: string | undefined) => {
      if (val !== undefined) {
        onChange(val);
      }
    },
    [onChange]
  );

  return (
    <Editor
      height="100%"
      language={LANGUAGE_MAP[language] || "cpp"}
      value={value}
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12, bottom: 12 },
        lineNumbers: "on",
        renderLineHighlight: "line",
        bracketPairColorization: { enabled: true },
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        smoothScrolling: true,
        tabSize: 4,
        wordWrap: "off",
        readOnly,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: true,
        folding: true,
        contextmenu: true,
      }}
      loading={
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-size-sm)",
        }}>
          Loading editor...
        </div>
      }
    />
  );
}

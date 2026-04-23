"use client";

import styles from "./LanguageSelector.module.css";

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
}

const LANGUAGES = [
  { id: "cpp", label: "C++ 17", icon: "⚡" },
  { id: "python", label: "Python 3", icon: "🐍" },
  { id: "java", label: "Java", icon: "☕" },
  { id: "go", label: "Go", icon: "🔷" },
  { id: "javascript", label: "JavaScript", icon: "🟨" },
  { id: "rust", label: "Rust", icon: "🦀" },
];

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <select
      className={styles.selector}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.icon} {lang.label}
        </option>
      ))}
    </select>
  );
}

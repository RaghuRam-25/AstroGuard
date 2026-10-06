"use client";

import React from "react";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  if (!content) return null;

  // Split content into blocks by double newlines
  const blocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-2.5 text-xs sm:text-sm leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headers
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={bIdx} className="text-xs sm:text-sm font-bold text-white tracking-wide mt-2 mb-1">
              {renderInline(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={bIdx} className="text-sm sm:text-base font-bold text-white tracking-wide mt-2.5 mb-1.5 border-b border-white/10 pb-1">
              {renderInline(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={bIdx} className="text-base sm:text-lg font-bold text-white tracking-wide mt-3 mb-2">
              {renderInline(trimmed.replace(/^#\s+/, ""))}
            </h2>
          );
        }

        // Bullet lists
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-3 list-disc marker:text-cyan-400">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="text-slate-300">
                  {renderInline(l.replace(/^\s*[-*•]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered lists
        const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));
        if (isNumberedList) {
          return (
            <ol key={bIdx} className="space-y-1.5 pl-4 list-decimal marker:text-cyan-400">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="text-slate-300">
                  {renderInline(l.replace(/^\s*\d+\.\s+/, ""))}
                </li>
              ))}
            </ol>
          );
        }

        // Code blocks
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
          const codeContent = trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "");
          return (
            <pre key={bIdx} className="rounded-xl border border-white/10 bg-black/40 p-3 overflow-x-auto font-mono text-[11px] text-cyan-200">
              <code>{codeContent}</code>
            </pre>
          );
        }

        // Mixed line block (lines with line breaks)
        return (
          <p key={bIdx} className="text-slate-200">
            {lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Parse inline bold, code, italic
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-sky-950/60 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300 border border-sky-400/20">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, zero-dependency Markdown renderer supporting:
 * - Headers (#, ##, ###)
 * - Bold (**text**) & Italics (*text* or _text_)
 * - Inline code (`code`) and Code blocks (```code```)
 * - Bullet lists (- item, * item) and Numbered lists (1. item)
 * - Blockquotes (> quote)
 * - Links ([text](url))
 * - Paragraphs and Linebreaks
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const renderInline = (text: string): React.ReactNode => {
    // Split by links, bold, italics, inline code
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // 1. Link: [label](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-google-blue hover:underline font-medium inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // 2. Bold: **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
      if (boldMatch) {
        parts.push(
          <strong key={key++} className="font-bold text-foreground">
            {renderInline(boldMatch[2])}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 3. Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      if (italicMatch) {
        parts.push(
          <em key={key++} className="italic">
            {renderInline(italicMatch[2])}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // 4. Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-muted font-mono text-[12px] text-google-red border border-border/60"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Plain character
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return <>{parts}</>;
  };

  // Split lines into blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`list_${blocks.length}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-muted-foreground">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`list_${blocks.length}`} className="list-decimal list-inside space-y-1.5 my-2 pl-2 text-muted-foreground">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push(
          <pre
            key={`code_${index}`}
            className="p-4 rounded-xl bg-black/90 text-white font-mono text-xs overflow-x-auto my-3 border border-border"
          >
            <code>{codeBlockBuffer.join('\n')}</code>
          </pre>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      blocks.push(
        <h3 key={index} className="text-base font-bold text-foreground mt-4 mb-1.5 font-sans">
          {renderInline(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(
        <h2 key={index} className="text-lg font-bold text-foreground mt-5 mb-2 font-sans">
          {renderInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      blocks.push(
        <h1 key={index} className="text-xl font-extrabold text-foreground mt-6 mb-2.5 font-sans">
          {renderInline(line.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote
          key={index}
          className="border-l-4 border-google-blue pl-4 py-1.5 my-2 italic text-muted-foreground bg-muted/20 rounded-r-lg"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Unordered List (- or *)
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      return;
    }

    // Ordered List (1. )
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      return;
    }

    // Regular paragraph
    flushList();
    blocks.push(
      <p key={index} className="text-sm leading-relaxed text-muted-foreground my-1.5">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};

export default MarkdownRenderer;

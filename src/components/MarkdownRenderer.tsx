import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, zero-dependency Markdown & Rich Docs renderer supporting:
 * - Headers (#, ##, ###, ####) with whitespace preservation
 * - Bold (**text**), Italics (*text* or _text_), Underline (<u>text</u>), Strikethrough (~~text~~)
 * - Inline code (`code`) and Code blocks (```code```)
 * - Bullet lists (- item, * item), Numbered lists (1. item), Checklist / Task lists (- [ ] item)
 * - Blockquotes (> quote)
 * - Links ([text](url))
 * - Tables (| Header 1 | Header 2 |)
 * - Text alignments (<div align="center">...</div>)
 * - Preserves spacing, whitespace and intentional line breaks exactly as written
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const renderInline = (text: string): React.ReactNode => {
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

      // 3. Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.*?)~~/);
      if (strikeMatch) {
        parts.push(
          <del key={key++} className="line-through opacity-75">
            {renderInline(strikeMatch[1])}
          </del>
        );
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // 4. Underline: <u>text</u>
      const underlineMatch = remaining.match(/^<u>(.*?)<\/u>/i);
      if (underlineMatch) {
        parts.push(
          <u key={key++} className="underline underline-offset-2">
            {renderInline(underlineMatch[1])}
          </u>
        );
        remaining = remaining.slice(underlineMatch[0].length);
        continue;
      }

      // 5. Italic: *text* or _text_
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

      // 6. Inline code: `code`
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

      // 7. Highlight / Mark: ==text== or <mark>text</mark>
      const markMatch = remaining.match(/^(?:==(.*?)==|<mark>(.*?)<\/mark>)/i);
      if (markMatch) {
        const markedContent = markMatch[1] || markMatch[2];
        parts.push(
          <mark key={key++} className="bg-yellow-200 dark:bg-yellow-900/40 text-inherit px-1 rounded">
            {renderInline(markedContent)}
          </mark>
        );
        remaining = remaining.slice(markMatch[0].length);
        continue;
      }

      // Plain character
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    }

    return <>{parts}</>;
  };

  // Split lines into blocks
  const rawLines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let currentTable: { headers: string[]; rows: string[][] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`list_${blocks.length}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-muted-foreground whitespace-pre-wrap">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`list_${blocks.length}`} className="list-decimal list-inside space-y-1.5 my-2 pl-2 text-muted-foreground whitespace-pre-wrap">
            {currentList.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const flushTable = () => {
    if (currentTable) {
      blocks.push(
        <div key={`table_${blocks.length}`} className="overflow-x-auto my-3 rounded-xl border border-border shadow-xs">
          <table className="min-w-full divide-y divide-border text-xs sm:text-sm">
            {currentTable.headers.length > 0 && (
              <thead className="bg-muted/60 font-semibold text-foreground">
                <tr>
                  {currentTable.headers.map((h, i) => (
                    <th key={i} className="px-3.5 py-2.5 text-left border-r border-border/60 last:border-r-0 whitespace-nowrap">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/60 bg-card">
              {currentTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-muted-foreground border-r border-border/60 last:border-r-0 whitespace-pre-wrap">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = null;
    }
  };

  const flushAll = () => {
    flushList();
    flushTable();
  };

  rawLines.forEach((line, index) => {
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
        flushAll();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      return;
    }

    // Markdown Table parsing: line starts and ends with | or contains |
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isTableDivider = isTableRow && /^\|(\s*:?-+:?\s*\|)+$/.test(line.trim());

    if (isTableDivider) {
      // Ignored separator row
      return;
    }

    if (isTableRow) {
      flushList();
      const cells = line.trim().slice(1, -1).split('|').map((c) => c.trim());
      if (!currentTable) {
        currentTable = { headers: cells, rows: [] };
      } else {
        currentTable.rows.push(cells);
      }
      return;
    } else {
      flushTable();
    }

    // Headers
    if (line.startsWith('#### ')) {
      flushAll();
      blocks.push(
        <h4 key={index} className="text-sm font-bold text-foreground mt-3 mb-1 font-sans whitespace-pre-wrap">
          {renderInline(line.slice(5))}
        </h4>
      );
      return;
    }
    if (line.startsWith('### ')) {
      flushAll();
      blocks.push(
        <h3 key={index} className="text-base font-bold text-foreground mt-4 mb-1.5 font-sans whitespace-pre-wrap">
          {renderInline(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      flushAll();
      blocks.push(
        <h2 key={index} className="text-lg font-bold text-foreground mt-5 mb-2 font-sans whitespace-pre-wrap">
          {renderInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      flushAll();
      blocks.push(
        <h1 key={index} className="text-xl font-extrabold text-foreground mt-6 mb-2.5 font-sans whitespace-pre-wrap">
          {renderInline(line.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushAll();
      blocks.push(
        <blockquote
          key={index}
          className="border-l-4 border-google-blue pl-4 py-1.5 my-2 italic text-muted-foreground bg-muted/20 rounded-r-lg whitespace-pre-wrap"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={index} className="my-4 border-t border-border/80" />);
      return;
    }

    // Task List (- [ ] or - [x])
    const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.+)/);
    if (taskMatch) {
      flushAll();
      const isChecked = taskMatch[2].toLowerCase() === 'x';
      blocks.push(
        <div key={index} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm pl-1 whitespace-pre-wrap">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="mt-1 h-3.5 w-3.5 rounded border-border text-google-blue focus:ring-0 cursor-default pointer-events-none"
          />
          <span className={isChecked ? 'line-through text-muted-foreground/75' : 'text-foreground'}>
            {renderInline(taskMatch[3])}
          </span>
        </div>
      );
      return;
    }

    // Unordered List (- or *)
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushAll();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[2]);
      return;
    }

    // Ordered List (1. )
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushAll();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      return;
    }

    // Empty line - preserve space intentionally!
    if (!line.trim()) {
      flushAll();
      blocks.push(<div key={`spacer_${index}`} className="h-3.5 sm:h-4" aria-hidden="true" />);
      return;
    }

    // Alignment tags: <div align="center">...</div> or <center>...</center>
    const centerMatch = line.match(/^(?:<div align="(center|right|left)">|<(center)>)(.*?)(?:<\/div>|<\/center>)?$/i);
    if (centerMatch) {
      flushAll();
      const align = (centerMatch[1] || 'center').toLowerCase();
      const innerText = centerMatch[3] || '';
      blocks.push(
        <p
          key={index}
          className={`text-sm leading-relaxed text-muted-foreground my-1.5 whitespace-pre-wrap ${
            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
          }`}
        >
          {renderInline(innerText)}
        </p>
      );
      return;
    }

    // Regular paragraph (preserves exact line spaces and indentation)
    flushAll();
    blocks.push(
      <p key={index} className="text-sm leading-relaxed text-muted-foreground my-1.5 whitespace-pre-wrap">
        {renderInline(line)}
      </p>
    );
  });

  flushAll();

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
};

export default MarkdownRenderer;

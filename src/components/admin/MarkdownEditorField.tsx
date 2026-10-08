import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Minus,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export interface MarkdownEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  showPreview?: boolean;
}

export const MarkdownEditorField: React.FC<MarkdownEditorFieldProps> = ({
  value,
  onChange,
  label = 'Markdown Content (supports **bold**, lists, headers, links)',
  placeholder = 'Write content, details, requirements or formatted markdown...',
  rows = 5,
  className = '',
  showPreview = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(showPreview);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  /**
   * Universal Markdown insertion & wrap helper
   */
  const insertFormatting = (
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = '',
    isLinePrefix: boolean = false
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (isLinePrefix) {
      // Find beginning of the current line
      const prevNewline = value.lastIndexOf('\n', start - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const beforeLine = value.substring(0, lineStart);
      const lineAndRest = value.substring(lineStart);

      const newContent = beforeLine + prefix + lineAndRest;
      onChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
      return;
    }

    const textToInsert = selectedText || defaultPlaceholder;
    const before = value.substring(0, start);
    const after = value.substring(end);

    const newContent = before + prefix + textToInsert + suffix + after;
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      // If no text was previously selected, highlight the placeholder so user can easily replace it
      if (!selectedText && defaultPlaceholder) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      } else {
        textarea.setSelectionRange(
          start + prefix.length + textToInsert.length + suffix.length,
          start + prefix.length + textToInsert.length + suffix.length
        );
      }
    }, 0);
  };

  /**
   * Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        insertFormatting('*', '*', 'italic text');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        insertFormatting('<u>', '</u>', 'underlined text');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        insertFormatting('[', '](https://example.com)', 'link text');
      }
    }
  };

  const applyTemplate = (templateContent: string) => {
    const separator = value.trim() ? '\n\n' : '';
    onChange(value + separator + templateContent);
    setShowTemplatesMenu(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const characterCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Top Header Label & Preview Toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[11px] font-semibold text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground/80 font-mono hidden sm:inline">
            {wordCount} words • {characterCount} chars
          </span>
          <button
            type="button"
            onClick={() => setIsPreviewVisible((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            title={isPreviewVisible ? 'Hide Live Preview' : 'Show Live Preview'}
          >
            {isPreviewVisible ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Container with Attached Toolbar */}
      <div className="rounded-xl border border-input bg-card shadow-xs overflow-hidden focus-within:ring-1 focus-within:ring-google-green focus-within:border-google-green transition-all">
        {/* Rich Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-muted/40 border-b border-border/70 text-muted-foreground">
          {/* Text Styling */}
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('<u>', '</u>', 'underlined text')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~', 'strikethrough text')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() => insertFormatting('# ', '', 'Heading 1', true)}
            className="px-1.5 py-1 rounded-lg text-[11px] font-bold hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95 flex items-center gap-0.5"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('## ', '', 'Heading 2', true)}
            className="px-1.5 py-1 rounded-lg text-[11px] font-bold hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95 flex items-center gap-0.5"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Heading 3', true)}
            className="px-1.5 py-1 rounded-lg text-[11px] font-bold hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95 flex items-center gap-0.5"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Lists & Checklists */}
          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'Bullet item', true)}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('1. ', '', 'Numbered item', true)}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ', '', 'Task item', true)}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Checklist / Task Item"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('> ', '', 'Important note or quote', true)}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Blockquote / Callout"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Code, Links, Dividers */}
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('```\n', '\n```', 'console.log("Hello GDG");')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Code Block"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('\n---\n', '', '')}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
            title="Horizontal Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Quick Snippet Templates Dropdown */}
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setShowTemplatesMenu((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-google-blue/10 hover:bg-google-blue/20 text-google-blue transition-colors shadow-2xs"
              title="Insert predefined markdown templates"
            >
              <Sparkles className="w-3 h-3 text-google-blue" />
              <span>Snippets</span>
            </button>

            {showTemplatesMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-60 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quick Event Templates
                </div>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `### What you will learn:\n- Core concepts and best practices\n- Hands-on coding session\n- Q&A with tech experts`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Objectives List</span>
                  <span className="text-[10px] text-muted-foreground">What you will learn template</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `### Prerequisites & Requirements:\n- [ ] Laptop with charger\n- [ ] Modern browser installed\n- [ ] Basic knowledge of web development`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Requirements Checklist</span>
                  <span className="text-[10px] text-muted-foreground">Interactive checklist items</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `### Event Agenda:\n1. 10:00 AM - Welcome & Introduction\n2. 10:30 AM - Deep Dive Tech Workshop\n3. 12:00 PM - Live Demo & Showcase\n4. 01:00 PM - Lunch & Networking`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Event Agenda / Timeline</span>
                  <span className="text-[10px] text-muted-foreground">Numbered schedule breakdown</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `> **Note:** Certificates will be issued only to participants who attend and verify their attendance on-site.`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Important Callout Box</span>
                  <span className="text-[10px] text-muted-foreground">Highlighted blockquote notice</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          className="w-full px-3.5 py-2.5 bg-transparent text-sm text-foreground font-mono text-xs focus:outline-none resize-y leading-relaxed overscroll-contain"
        />
      </div>

      {/* Live Rendered Markdown Preview inside the field */}
      {isPreviewVisible && value.trim() && (
        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-border/40">
            <p className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
              Rendered Markdown Preview:
            </p>
            <span className="text-[10px] text-google-green font-semibold">● Live update</span>
          </div>
          <MarkdownRenderer content={value} />
        </div>
      )}
    </div>
  );
};
export default MarkdownEditorField;

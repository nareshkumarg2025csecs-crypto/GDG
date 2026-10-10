import React, { useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Minus,
  Table as TableIcon,
  Sparkles,
  Eye,
  EyeOff,
  Columns,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  ChevronsDownUp,
  ChevronsUpDown,
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

type EditorSizeMode = 'compact' | 'normal' | 'expanded' | 'fullscreen';
type ViewTab = 'edit' | 'split' | 'preview';

export const MarkdownEditorField: React.FC<MarkdownEditorFieldProps> = ({
  value,
  onChange,
  label = 'Document & About Content (Google Docs Rich Editor)',
  placeholder = 'Write or paste event overview, agenda, prerequisites, objectives...',
  rows = 8,
  className = '',
  showPreview = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [sizeMode, setSizeMode] = useState<EditorSizeMode>('normal');
  const [viewTab, setViewTab] = useState<ViewTab>(showPreview ? 'split' : 'edit');
  const [splitRatio, setSplitRatio] = useState<number>(65); // 65% editor, 35% preview default
  const [isDragging, setIsDragging] = useState(false);
  const [showHeadingsMenu, setShowHeadingsMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(25, Math.min(85, Math.round(newRatio)));
    setSplitRatio(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch { }
    }
  };

  // Undo / Redo History Stack
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushToHistory = useCallback((newText: string) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newText];
    });
    setHistoryIndex((prev) => prev + 1);
    onChange(newText);
  }, [historyIndex, onChange]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      onChange(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      onChange(history[nextIndex]);
    }
  };

  /**
   * Universal Markdown & HTML insertion helper
   */
  const insertFormatting = (
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = '',
    isLinePrefix: boolean = false
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      pushToHistory(value + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (isLinePrefix) {
      // Find start of current line
      const prevNewline = value.lastIndexOf('\n', start - 1);
      const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const beforeLine = value.substring(0, lineStart);
      const lineAndRest = value.substring(lineStart);

      const newContent = beforeLine + prefix + lineAndRest;
      pushToHistory(newContent);

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
    pushToHistory(newContent);

    setTimeout(() => {
      textarea.focus();
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
   * Insert Google Docs styled Table
   */
  const insertTable = () => {
    const tableTemplate = `\n| Item / Column 1 | Description / Column 2 | Details / Column 3 |\n| :--- | :--- | :--- |\n| Section 1 | Key takeaway or learning | Details here |\n| Section 2 | Hands-on workshop topic | Live demo |\n\n`;
    insertFormatting(tableTemplate);
  };

  /**
   * Keyboard shortcuts & Tab handling
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key indent/outdent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Outdent 2 spaces
        const before = value.substring(0, start);
        if (before.endsWith('  ')) {
          const newContent = before.slice(0, -2) + value.substring(start);
          pushToHistory(newContent);
          setTimeout(() => {
            textarea.setSelectionRange(start - 2, end - 2);
          }, 0);
        }
      } else {
        // Indent 2 spaces
        const newContent = value.substring(0, start) + '  ' + value.substring(end);
        pushToHistory(newContent);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
      return;
    }

    // Ctrl+Z / Ctrl+Y
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'b' || e.key === 'B') {
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
    pushToHistory(value + separator + templateContent);
    setShowTemplatesMenu(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const characterCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Determine editor canvas height styling based on sizeMode with explicit guaranteed minimums
  const getEditorHeight = (): { minHeight: number; height: string } => {
    switch (sizeMode) {
      case 'compact':
        return { minHeight: 260, height: '280px' };
      case 'expanded':
        return { minHeight: 650, height: '700px' };
      case 'fullscreen':
        return { minHeight: 500, height: 'calc(100vh - 140px)' };
      case 'normal':
      default:
        return { minHeight: 460, height: '480px' };
    }
  };

  // Google Docs Container Layout
  const editorBody = (
    <div
      className={`rounded-2xl border border-input bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-google-blue/30 focus-within:border-google-blue transition-all flex flex-col ${sizeMode === 'fullscreen' ? 'h-full w-full max-w-5xl mx-auto border-border' : ''
        }`}
    >
      {/* ============================================================ */}
      {/* GOOGLE DOCS STYLE MAIN TOOLBAR */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 border-b border-border/70 text-muted-foreground select-none">
        {/* Undo & Redo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* Headings & Style Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHeadingsMenu((p) => !p);
              setShowAlignMenu(false);
              setShowTemplatesMenu(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-background hover:text-foreground transition-colors border border-border/50 bg-background/50"
            title="Styles & Headings"
          >
            <Heading className="w-3.5 h-3.5 text-google-blue" />
            <span>Styles</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showHeadingsMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-44 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 space-y-1 text-xs animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  insertFormatting('# ', '', 'Title Heading', true);
                  setShowHeadingsMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted font-bold text-sm text-foreground flex items-center justify-between"
              >
                <span>Title</span>
                <span className="text-[10px] text-muted-foreground font-mono">#</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  insertFormatting('## ', '', 'Heading 1', true);
                  setShowHeadingsMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted font-bold text-xs text-foreground flex items-center justify-between"
              >
                <span>Heading 1</span>
                <span className="text-[10px] text-muted-foreground font-mono">##</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  insertFormatting('### ', '', 'Heading 2', true);
                  setShowHeadingsMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted font-semibold text-xs text-foreground flex items-center justify-between"
              >
                <span>Heading 2</span>
                <span className="text-[10px] text-muted-foreground font-mono">###</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  insertFormatting('#### ', '', 'Heading 3', true);
                  setShowHeadingsMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-xs text-foreground flex items-center justify-between"
              >
                <span>Heading 3</span>
                <span className="text-[10px] text-muted-foreground font-mono">####</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border/80 mx-1" />

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

        <button
          type="button"
          onClick={() => insertFormatting('==', '==', 'highlighted text')}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors hover:shadow-2xs active:scale-95"
          title="Highlight text"
        >
          <Highlighter className="w-3.5 h-3.5 text-yellow-500" />
        </button>

        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* Align Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowAlignMenu((p) => !p);
              setShowHeadingsMenu(false);
              setShowTemplatesMenu(false);
            }}
            className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors flex items-center gap-0.5"
            title="Text Alignment"
          >
            <AlignCenter className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showAlignMenu && (
            <div className="absolute left-0 top-full mt-1.5 p-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 flex gap-1 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  insertFormatting('<div align="left">\n', '\n</div>', 'left-aligned text');
                  setShowAlignMenu(false);
                }}
                className="p-1.5 rounded-lg hover:bg-muted"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  insertFormatting('<div align="center">\n', '\n</div>', 'centered text');
                  setShowAlignMenu(false);
                }}
                className="p-1.5 rounded-lg hover:bg-muted"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  insertFormatting('<div align="right">\n', '\n</div>', 'right-aligned text');
                  setShowAlignMenu(false);
                }}
                className="p-1.5 rounded-lg hover:bg-muted"
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* Lists & Tasks */}
        <button
          type="button"
          onClick={() => insertFormatting('- ', '', 'Bullet item', true)}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('1. ', '', 'Numbered item', true)}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('- [ ] ', '', 'Checklist task item', true)}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Checklist / Task"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('> ', '', 'Important note or quote', true)}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Callout Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-border/80 mx-1" />

        {/* Insert Table, Code, Links, Dividers */}
        <button
          type="button"
          onClick={insertTable}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors text-google-green"
          title="Insert Google Docs Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('[', '](https://example.com)', 'link text')}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('`', '`', 'code')}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('```\n', '\n```', 'console.log("Hello GDG");')}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Code Block"
        >
          <FileCode className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('\n---\n', '', '')}
          className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
          title="Horizontal Line"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Right Section: Sizing and View Modes */}
        <div className="ml-auto flex items-center gap-1">
          {/* Quick Templates */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTemplatesMenu((p) => !p);
                setShowHeadingsMenu(false);
                setShowAlignMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-google-blue/10 hover:bg-google-blue/20 text-google-blue transition-colors"
              title="Insert predefined document templates"
            >
              <Sparkles className="w-3 h-3 text-google-blue" />
              <span className="hidden sm:inline">Snippets</span>
            </button>

            {showTemplatesMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-1.5 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50 space-y-1 text-xs animate-in fade-in duration-100">
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Google Docs Templates
                </div>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `## 1. Event Overview:\n**Event Name** is a hands-on learning experience designed for students to master modern technologies.\n\n## 2. Objectives:\n- Master core developer principles\n- Build practical real-world projects\n- Network with industry leads and fellow students\n\n## 3. Prerequisites:\n- [ ] Laptop with internet access\n- [ ] Willingness to learn and collaborate`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Complete Event Structure</span>
                  <span className="text-[10px] text-muted-foreground">Overview, Objectives & Prerequisites</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `| Time | Session Topic | Speaker / Host |\n| :--- | :--- | :--- |\n| 10:00 AM | Welcome & Keynote | Lead Organizers |\n| 10:30 AM | Deep-Dive Workshop | Tech Speaker |\n| 12:30 PM | Hands-on Project Demo | All Participants |\n| 01:30 PM | Networking & Q&A | Community |`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Timeline Table</span>
                  <span className="text-[10px] text-muted-foreground">Structured schedule table</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate(
                      `> **Important Notice:** Please ensure your attendance is verified on-site during the event to receive official participation certification.`
                    )
                  }
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors flex flex-col"
                >
                  <span className="font-semibold text-foreground">Callout Notice</span>
                  <span className="text-[10px] text-muted-foreground">Highlighted important box</span>
                </button>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Sizing: Minimize vs Normal vs Expand */}
          {sizeMode === 'compact' ? (
            <button
              type="button"
              onClick={() => setSizeMode('normal')}
              className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
              title="Expand Editor Height"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-google-blue" />
            </button>
          ) : sizeMode === 'expanded' ? (
            <button
              type="button"
              onClick={() => setSizeMode('normal')}
              className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
              title="Return to Normal Height"
            >
              <ChevronsDownUp className="w-3.5 h-3.5 text-google-yellow" />
            </button>
          ) : (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setSizeMode('compact')}
                className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
                title="Minimize Typing Area"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSizeMode('expanded')}
                className="p-1.5 rounded-lg hover:bg-background hover:text-foreground transition-colors"
                title="Make Typing Area Bigger"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setSizeMode((m) => (m === 'fullscreen' ? 'normal' : 'fullscreen'))}
            className={`p-1.5 rounded-lg transition-colors ${sizeMode === 'fullscreen'
                ? 'bg-google-blue text-white shadow-xs'
                : 'hover:bg-background hover:text-foreground'
              }`}
            title={sizeMode === 'fullscreen' ? 'Exit Fullscreen' : 'Full Screen Document View'}
          >
            {sizeMode === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECONDARY VIEW SELECTOR & DOCUMENT STATS BAR */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-muted/20 border-b border-border/50 text-[11px] text-muted-foreground gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewTab('edit')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${viewTab === 'edit'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'hover:text-foreground'
              }`}
          >
            Editor Only (100% Space)
          </button>
          <button
            type="button"
            onClick={() => setViewTab('split')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${viewTab === 'split'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'hover:text-foreground'
              }`}
          >
            <Columns className="w-3 h-3" />
            <span>Split Preview</span>
            <span className="text-[10px] text-google-blue font-bold px-1 py-0.2 rounded bg-google-blue/10">
              {splitRatio}:{100 - splitRatio}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('preview')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${viewTab === 'preview'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'hover:text-foreground'
              }`}
          >
            <Eye className="w-3 h-3" />
            <span>Live Preview</span>
          </button>

          {/* Quick ratio presets when in Split view */}
          {viewTab === 'split' && (
            <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-border/50 text-[10px]">
              <span className="text-muted-foreground/70">Split Ratio:</span>
              {[
                { label: '50:50', ratio: 50 },
                { label: '65:35', ratio: 65 },
                { label: '80:20', ratio: 80 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSplitRatio(preset.ratio)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${splitRatio === preset.ratio
                      ? 'bg-google-blue text-white font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                    }`}
                  title={`Allocate ${preset.ratio}% width to editor and ${100 - preset.ratio}% to preview`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          {viewTab === 'split' && (
            <span className="hidden md:inline text-[10px] text-muted-foreground/60 italic">
              (Drag center bar to resize)
            </span>
          )}
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{characterCount} chars</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{readingTime} min read</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EDITOR CANVAS & PREVIEW WORKSPACE */}
      {/* ============================================================ */}
      <div
        ref={workspaceRef}
        className="flex flex-col md:flex-row overflow-hidden relative items-stretch resize-y border-t border-border/50"
        style={{
          minHeight: `${getEditorHeight().minHeight}px`,
          height: getEditorHeight().height,
        }}
      >
        {/* Left: Raw Markdown Editor (Same Level as Preview) */}
        {(viewTab === 'edit' || viewTab === 'split') && (
          <div
            className={`p-4 sm:p-5 bg-background/50 flex flex-col overflow-hidden ${
              viewTab === 'edit' ? 'w-full flex-1' : 'w-full md:w-auto shrink-0'
            }`}
            style={{
              width: viewTab === 'split' ? `clamp(25%, ${splitRatio}%, 85%)` : '100%',
              minHeight: `${getEditorHeight().minHeight}px`,
              height: '100%',
            }}
          >
            {/* Symmetrical header matching preview */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40 shrink-0">
              <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
                Raw Markdown Source
              </span>
              <span className="text-[10px] text-google-blue font-semibold">● Typing Area</span>
            </div>

            {/* Direct Textarea with guaranteed minHeight so it can NEVER collapse */}
            <textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={value}
              onChange={(e) => pushToHistory(e.target.value)}
              onKeyDown={handleKeyDown}
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="w-full flex-1 bg-transparent text-sm text-foreground font-mono focus:outline-none resize-none leading-relaxed overflow-y-auto overscroll-contain whitespace-pre-wrap block border-0 outline-none p-0"
              style={{
                minHeight: `${getEditorHeight().minHeight - 55}px`,
                height: '100%',
                tabSize: 2,
              }}
            />
          </div>
        )}

        {/* Center Draggable Divider Bar */}
        {viewTab === 'split' && (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`hidden md:flex flex-col items-center justify-center w-2.5 hover:w-3 cursor-col-resize transition-colors select-none z-20 shrink-0 border-x border-border/60 self-stretch ${
              isDragging
                ? 'bg-google-blue text-white'
                : 'bg-muted/50 hover:bg-google-blue/30'
            }`}
            title="Click and drag horizontally to allocate more or less space to the editor"
          >
            <div className={`w-0.5 h-8 rounded-full ${isDragging ? 'bg-white' : 'bg-muted-foreground/50'}`} />
          </div>
        )}

        {/* Right: Live Google Docs Formatted Preview */}
        {(viewTab === 'preview' || viewTab === 'split') && (
          <div
            className={`p-4 sm:p-6 bg-card/80 overflow-y-auto flex-1 ${
              viewTab === 'preview' ? 'w-full' : ''
            }`}
            style={{
              width: viewTab === 'split' ? `clamp(15%, ${100 - splitRatio}%, 75%)` : '100%',
              minHeight: `${getEditorHeight().minHeight}px`,
              height: '100%',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/40">
              <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
                Rendered Document Preview
              </span>
              <span className="text-[10px] text-google-green font-semibold">● Real-time</span>
            </div>
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic py-10">
                Type on the left to see exact live rendered document preview...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Label and Quick View Toggle */}
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-foreground flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-google-blue" />
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-[11px] font-mono hidden sm:inline">
            Status: {sizeMode === 'compact' ? 'Minimized' : sizeMode === 'expanded' ? 'Expanded' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Normal View or Fullscreen Overlay View */}
      {sizeMode === 'fullscreen' ? (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-center animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-3 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-google-blue" />
              <h3 className="font-display font-bold text-foreground text-base sm:text-lg">
                Google Docs Fullscreen Document Editor
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSizeMode('normal')}
              className="px-3 py-1 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors flex items-center gap-1 border border-border"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen (Esc)</span>
            </button>
          </div>
          {editorBody}
        </div>
      ) : (
        editorBody
      )}
    </div>
  );
};

export default MarkdownEditorField;

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Strikethrough, Link, List, Quote, Code } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function MarkdownToolbar({ textareaRef }: MarkdownToolbarProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelection = () => {
      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

      if (selectedText.length > 0 && document.activeElement === textarea) {
        const textareaRect = textarea.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        const { selectionStart, selectionEnd } = textarea;
        const textBeforeSelection = textarea.value.substring(0, selectionStart);
        const lines = textBeforeSelection.split('\n');
        const currentLine = lines.length - 1;
        const charInLine = lines[lines.length - 1].length;

        const lineHeight = 24;
        const charWidth = 8;

        const estimatedTop = textareaRect.top + scrollTop + (currentLine * lineHeight) - textarea.scrollTop;
        const selectionMiddle = textareaRect.left + scrollLeft + (charInLine * charWidth);

        const toolbarHeight = 50;
        const toolbarWidth = 300;

        let finalTop = estimatedTop - toolbarHeight - 10;
        let finalLeft = selectionMiddle - (toolbarWidth / 2);

        finalLeft = Math.min(
          Math.max(finalLeft, scrollLeft + 10),
          window.innerWidth + scrollLeft - toolbarWidth - 10
        );

        if (finalTop < scrollTop + 10) {
          finalTop = estimatedTop + lineHeight + 10;
        }

        setPosition({
          top: finalTop,
          left: finalLeft,
        });
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    };

    textarea.addEventListener('mouseup', handleSelection);
    textarea.addEventListener('keyup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);

    return () => {
      textarea.removeEventListener('mouseup', handleSelection);
      textarea.removeEventListener('keyup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
    };
  }, [textareaRef]);

  const wrapText = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = `${before}${selectedText}${after}`;

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    textarea.value = beforeText + newText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);

    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);

    setShowToolbar(false);
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const linkText = selectedText || 'link text';
    const newText = `[${linkText}](url)`;

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    textarea.value = beforeText + newText + afterText;
    textarea.focus();

    const urlStart = start + linkText.length + 3;
    textarea.setSelectionRange(urlStart, urlStart + 3);

    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);

    setShowToolbar(false);
  };

  const insertList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const lines = selectedText.split('\n');
    const newText = lines.map(line => `- ${line}`).join('\n');

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    textarea.value = beforeText + newText + afterText;
    textarea.focus();

    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);

    setShowToolbar(false);
  };

  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const lines = selectedText.split('\n');
    const newText = lines.map(line => `> ${line}`).join('\n');

    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    textarea.value = beforeText + newText + afterText;
    textarea.focus();

    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);

    setShowToolbar(false);
  };

  if (!showToolbar) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700/50 backdrop-blur-sm px-3 py-2.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
      }}
    >
      <button
        type="button"
        onClick={() => wrapText('**')}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => wrapText('*')}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => wrapText('~~')}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-600 to-transparent mx-1" />
      <button
        type="button"
        onClick={insertLink}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Insert Link"
      >
        <Link className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={insertList}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Insert List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={insertQuote}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Insert Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => wrapText('`')}
        className="p-2.5 hover:bg-gradient-to-br hover:from-gray-700 hover:to-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </button>
    </div>
  );
}

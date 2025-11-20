import { useState } from 'react';
import { FileText, X } from 'lucide-react';

interface MarkdownGuideProps {
  onClose: () => void;
}

export function MarkdownGuide({ onClose }: MarkdownGuideProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl border border-border max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-foreground">Markdown Formatting Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Text Styling</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">**Bold text**</code>
                <div className="flex-1">
                  <strong className="text-foreground">Bold text</strong>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">*Italic text*</code>
                <div className="flex-1">
                  <em className="text-foreground">Italic text</em>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">~~Strikethrough~~</code>
                <div className="flex-1">
                  <s className="text-foreground">Strikethrough</s>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">`Inline code`</code>
                <div className="flex-1">
                  <code className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm">Inline code</code>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Headings</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground"># Heading 1</code>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-foreground">Heading 1</h1>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">## Heading 2</code>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">Heading 2</h2>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">### Heading 3</code>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">Heading 3</h3>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Lists</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground whitespace-pre">
                  {`- Item 1\n- Item 2\n- Item 3`}
                </code>
                <div className="flex-1">
                  <ul className="list-disc list-inside text-foreground">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground whitespace-pre">
                  {`1. First item\n2. Second item\n3. Third item`}
                </code>
                <div className="flex-1">
                  <ol className="list-decimal list-inside text-foreground">
                    <li>First item</li>
                    <li>Second item</li>
                    <li>Third item</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Links & Quotes</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">[Link text](https://example.com)</code>
                <div className="flex-1">
                  <a href="#" className="text-red-600 hover:underline">Link text</a>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-accent/50 rounded-xl">
                <code className="text-sm flex-1 text-muted-foreground">&gt; Quote text</code>
                <div className="flex-1">
                  <blockquote className="border-l-4 border-gray-400 pl-4 italic text-muted-foreground">
                    Quote text
                  </blockquote>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Code Blocks</h3>
            <div className="space-y-3">
              <div className="p-4 bg-accent/50 rounded-xl">
                <code className="text-sm text-muted-foreground block mb-2">```</code>
                <code className="text-sm text-muted-foreground block mb-2">Code block content</code>
                <code className="text-sm text-muted-foreground block">```</code>
                <div className="mt-3 p-3 bg-gray-200 dark:bg-gray-800 rounded-lg">
                  <code className="text-sm">Code block content</code>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Select text in the textarea to see quick formatting buttons, or click the MD badge to view this guide anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarkdownBadge() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
        title="Markdown supported - Click for guide"
      >
        <FileText className="w-4 h-4" />
        Markdown Guide
      </button>
      {showGuide && <MarkdownGuide onClose={() => setShowGuide(false)} />}
    </>
  );
}

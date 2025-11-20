import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-foreground mt-6 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-bold text-foreground mt-5 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-bold text-foreground mt-4 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-foreground mb-4 leading-relaxed">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline"
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4 text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded text-sm font-mono text-foreground">
                {children}
              </code>
            );
          }
          return (
            <code className="block p-4 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm font-mono text-foreground overflow-x-auto my-4">
              {children}
            </code>
          );
        },
        strong: ({ children }) => (
          <strong className="font-bold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground">{children}</em>
        ),
        del: ({ children }) => (
          <del className="line-through text-muted-foreground">{children}</del>
        ),
        hr: () => (
          <hr className="border-t border-border my-6" />
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { renderMarkdown } from '@/lib/markdown/render';

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMarkdown(markdown);
    }, 200);
    return () => clearTimeout(timer);
  }, [markdown]);

  return (
    <div className="rounded-xl border border-fg/10 bg-white px-6 py-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-fg/40">
        Preview
      </p>
      {debouncedMarkdown.trim() ? (
        <div className="prose-blog">{renderMarkdown(debouncedMarkdown)}</div>
      ) : (
        <p className="text-sm text-fg/35 italic">Nothing to preview yet.</p>
      )}
    </div>
  );
}

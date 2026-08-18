import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { BookMarked, Loader2 } from 'lucide-react';
import type { ManualChapter } from '../types';
import { cn } from '../lib/utils';

interface Props {
  chapters: ManualChapter[];
  basePath: string; // import.meta.env.BASE_URL
}

export function ManualViewer({ chapters, basePath }: Props) {
  const [activeFolder, setActiveFolder] = useState<string | null>(chapters[0]?.folder ?? null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.folder === activeFolder) ?? null,
    [chapters, activeFolder]
  );

  useEffect(() => {
    if (!activeChapter) return;
    const mdFile = activeChapter.files.find((f) => f.type === 'markdown');
    if (!mdFile) {
      setContent('（此章節無 Markdown 內容）');
      return;
    }
    setLoading(true);
    fetch(`${basePath}${mdFile.path}`)
      .then((res) => res.text())
      .then((text) => {
        // Rewrite relative image paths to resolve against the manual folder
        const rewritten = text.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
          (_m, alt, src) => `![${alt}](${basePath}manual_md/${activeChapter.folder}/${src})`
        );
        setContent(rewritten);
      })
      .catch(() => setContent('（載入章節內容失敗）'))
      .finally(() => setLoading(false));
  }, [activeChapter, basePath]);

  if (chapters.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        尚未提供手冊內容（可將 Markdown 檔案放入 public/manual_md/ 章節資料夾中並重新建置）。
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <aside className="w-52 shrink-0 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-2 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <BookMarked size={13} /> 章節目錄
        </div>
        <ul className="space-y-0.5">
          {chapters.map((c) => (
            <li key={c.folder}>
              <button
                onClick={() => setActiveFolder(c.folder)}
                className={cn(
                  'w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition',
                  activeFolder === c.folder
                    ? 'bg-indigo-600/10 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )}
              >
                {c.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/80">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> 載入章節內容中…
          </div>
        ) : (
          <motion.div
            key={activeFolder}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none prose-slate dark:prose-invert"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </motion.div>
        )}
      </div>
    </div>
  );
}

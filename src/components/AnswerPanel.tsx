import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'motion/react';
import { Sparkles, Copy, Check, Loader2 } from 'lucide-react';

interface Props {
  answer: string;
  loading: boolean;
  error: string | null;
  hasAsked: boolean;
}

export function AnswerPanel({ answer, loading, error, hasAsked }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!answer) return;
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">AI 回答</span>
          {loading && <Loader2 size={13} className="animate-spin text-indigo-500" />}
        </div>
        {answer && !loading && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '已複製' : '複製回答'}
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-3.5 rounded bg-slate-100 dark:bg-slate-800"
                style={{ width: `${90 - i * 12}%` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.15 }}
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {!loading && !error && !hasAsked && (
          <p className="text-sm text-slate-400">勾選左側文件並輸入問題後，回答將顯示於此。</p>
        )}

        {!loading && !error && hasAsked && answer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-p:leading-relaxed"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
          </motion.div>
        )}
      </div>
    </div>
  );
}

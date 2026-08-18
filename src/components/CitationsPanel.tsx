import { motion } from 'motion/react';
import { Quote, BookOpenText } from 'lucide-react';
import type { Citation } from '../types';

interface Props {
  citations: Citation[];
  hasAsked: boolean;
}

export function CitationsPanel({ citations, hasAsked }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <BookOpenText size={15} className="text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          引用出處 {citations.length > 0 && `(${citations.length})`}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!hasAsked && <p className="text-sm text-slate-400">回答的引用出處將顯示於此。</p>}
        {hasAsked && citations.length === 0 && (
          <p className="text-sm text-slate-400">此回答未提供可對應的引用出處。</p>
        )}
        <div className="space-y-2.5">
          {citations.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-amber-100 bg-amber-50/60 p-3 dark:border-amber-900/30 dark:bg-amber-950/20"
            >
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <Quote size={12} className="mr-1 inline text-amber-500" />
                {c.text}
                <Quote size={12} className="ml-1 inline rotate-180 text-amber-500" />
              </p>
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {c.source}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

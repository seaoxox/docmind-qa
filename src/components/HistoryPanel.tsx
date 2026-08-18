import { History, Trash2 } from 'lucide-react';
import type { QuestionRecord } from '../types';
import { cn, formatTimestamp, truncate } from '../lib/utils';

interface Props {
  history: QuestionRecord[];
  activeId: string | null;
  onSelect: (record: QuestionRecord) => void;
  onClear: () => void;
}

export function HistoryPanel({ history, activeId, onSelect, onClear }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
          <History size={14} /> 歷史紀錄
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500"
          >
            <Trash2 size={12} /> 清空
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {history.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-slate-400">尚無提問紀錄</p>
        )}
        <ul className="space-y-1">
          {history.map((record) => (
            <li key={record.id}>
              <button
                onClick={() => onSelect(record)}
                className={cn(
                  'block w-full rounded-lg px-2.5 py-2 text-left transition',
                  activeId === record.id
                    ? 'bg-indigo-600/10 ring-1 ring-inset ring-indigo-600/40 dark:bg-indigo-500/15 dark:ring-indigo-500/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )}
              >
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                  {truncate(record.question, 40)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{formatTimestamp(record.timestamp)}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

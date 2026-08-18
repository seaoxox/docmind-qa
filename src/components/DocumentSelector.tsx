import { useRef, useState } from 'react';
import { ChevronDown, FileText, FileType, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
import type { AppDocument } from '../types';
import { cn } from '../lib/utils';

type SelectableCategory = 'main' | 'extra';

interface Props {
  title: string;
  category: SelectableCategory;
  docs: AppDocument[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (category: SelectableCategory, ids: string[], value: boolean) => void;
  onUpload: (files: FileList, category: SelectableCategory) => void;
  onRemove: (id: string) => void;
  loading: boolean;
}

function docIcon(type: AppDocument['type']) {
  switch (type) {
    case 'word':
      return <FileType size={14} className="text-blue-500" />;
    case 'pdf':
      return <FileText size={14} className="text-rose-500" />;
    default:
      return <FileText size={14} className="text-slate-400" />;
  }
}

export function DocumentSelector({
  title,
  category,
  docs,
  selectedIds,
  onToggle,
  onToggleAll,
  onUpload,
  onRemove,
  loading,
}: Props) {
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCount = docs.filter((d) => selectedIds.has(d.id)).length;
  const allSelected = docs.length > 0 && selectedCount === docs.length;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/80">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-indigo-500">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={cn('text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <button
              onClick={() => onToggleAll(category, docs.map((d) => d.id), !allSelected)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              disabled={docs.length === 0}
            >
              {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
              {allSelected ? '取消全選' : '全部選取'}
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              <Upload size={12} /> 上傳
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".docx,.doc,.pdf,.md,.markdown,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) onUpload(e.target.files, category);
                e.target.value = '';
              }}
            />
          </div>

          {loading && <p className="py-2 text-xs text-slate-400">解析文件中…</p>}

          {docs.length === 0 && !loading && (
            <p className="py-2 text-xs text-slate-400">尚無文件，請點擊「上傳」加入 Word / PDF / Markdown 文件。</p>
          )}

          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(doc.id)}
                  onChange={() => onToggle(doc.id)}
                  className="h-3.5 w-3.5 rounded accent-indigo-600"
                />
                {docIcon(doc.type)}
                <span className="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-300" title={doc.name}>
                  {doc.name}
                </span>
                {!doc.builtIn && (
                  <button
                    onClick={() => onRemove(doc.id)}
                    className="hidden text-slate-300 hover:text-rose-500 group-hover:block dark:text-slate-600"
                    title="移除"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

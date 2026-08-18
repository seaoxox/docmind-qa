import { useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { SendHorizontal, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (question: string) => void;
  loading: boolean;
  selectedCount: number;
}

export function ChatInput({ onSubmit, loading, selectedCount }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          selectedCount === 0
            ? '請先勾選文件，再輸入您的問題…（Enter 送出，Shift+Enter 換行）'
            : `已勾選 ${selectedCount} 份文件，輸入您的問題…（Enter 送出，Shift+Enter 換行）`
        }
        rows={2}
        className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-1.5 py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
      <div className="flex items-center justify-end">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:bg-indigo-500"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <SendHorizontal size={14} />}
          {loading ? '生成中' : '送出'}
        </motion.button>
      </div>
    </div>
  );
}

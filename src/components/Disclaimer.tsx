import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  open: boolean;
  onAccept: () => void;
}

export function Disclaimer({ open, onAccept }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">使用免責聲明</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                本系統（DocMind Q&A）之回答內容由 AI 模型根據您所勾選之文件自動生成，僅供參考，
                <strong className="text-slate-800 dark:text-slate-200">不構成專業醫療、法律或法規建議</strong>。
              </p>
              <p>
                使用者應自行查核回答內容與引用出處是否與原始文件相符，並以正式指引文件之最新版本為準。
              </p>
              <p>
                本系統為純前端應用，文件解析於您的瀏覽器本機完成；您所勾選文件之文字內容與提問，將傳送至您自行設定的
                AI 供應商（Gemini / OpenAI / Anthropic）API，請自行評估資料敏感性。
              </p>
            </div>
            <button
              onClick={onAccept}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              我已閱讀並同意，開始使用
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit,
  Settings as SettingsIcon,
  FileStack,
  History as HistoryIcon,
  X,
  BookOpenText,
  Sparkles,
} from 'lucide-react';

import type { AppDocument, ManualChapter, ProviderSettings, QuestionRecord, ViewMode, AnswerTab } from './types';
import { cn, taipeiDateString, uid } from './lib/utils';
import { parseFile, parseFromUrl } from './services/docParser';
import { askQuestion } from './services/aiService';
import { loadManifest } from './services/manifest';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  loadTheme,
  saveTheme,
  getDisclaimerAcceptedDate,
  setDisclaimerAcceptedDate,
} from './services/storage';

import { Disclaimer } from './components/Disclaimer';
import { SettingsModal } from './components/SettingsModal';
import { DocumentSelector } from './components/DocumentSelector';
import { HistoryPanel } from './components/HistoryPanel';
import { AnswerPanel } from './components/AnswerPanel';
import { CitationsPanel } from './components/CitationsPanel';
import { ChatInput } from './components/ChatInput';
import { ThemeToggle } from './components/ThemeToggle';
import { ManualViewer } from './components/ManualViewer';

const BASE = import.meta.env.BASE_URL;

export default function App() {
  // ---- Theme ----
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme());
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  // ---- Disclaimer ----
  const [disclaimerOpen, setDisclaimerOpen] = useState(() => getDisclaimerAcceptedDate() !== taipeiDateString());
  const acceptDisclaimer = () => {
    setDisclaimerAcceptedDate(taipeiDateString());
    setDisclaimerOpen(false);
  };

  // ---- Settings ----
  const [settings, setSettings] = useState<ProviderSettings>(loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleSaveSettings = (s: ProviderSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  // ---- View mode ----
  const [viewMode, setViewMode] = useState<ViewMode>('qa');
  const [answerTab, setAnswerTab] = useState<AnswerTab>('answer');

  // ---- Documents ----
  const [mainDocs, setMainDocs] = useState<AppDocument[]>([]);
  const [extraDocs, setExtraDocs] = useState<AppDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [docsLoading, setDocsLoading] = useState(true);
  const [manualChapters, setManualChapters] = useState<ManualChapter[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDocsLoading(true);
      try {
        const manifest = await loadManifest();
        const mainResults = await Promise.allSettled(
          manifest.instructionFiles.map((name) => parseFromUrl(`${BASE}instruction_files/${name}`, name, 'main'))
        );
        const extraResults = await Promise.allSettled(
          manifest.subInstructionFiles.map((name) =>
            parseFromUrl(`${BASE}sub_instruction_files/${name}`, name, 'extra')
          )
        );
        if (cancelled) return;
        const main = mainResults
          .filter((r): r is PromiseFulfilledResult<AppDocument> => r.status === 'fulfilled')
          .map((r) => r.value);
        const extra = extraResults
          .filter((r): r is PromiseFulfilledResult<AppDocument> => r.status === 'fulfilled')
          .map((r) => r.value);
        setMainDocs(main);
        setExtraDocs(extra);
        setManualChapters(manifest.manual);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (_category: string, ids: string[], value: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const handleUpload = async (files: FileList, category: 'main' | 'extra') => {
    setDocsLoading(true);
    try {
      const parsed = await Promise.all(Array.from(files).map((f) => parseFile(f, category)));
      if (category === 'main') setMainDocs((prev) => [...prev, ...parsed]);
      else setExtraDocs((prev) => [...prev, ...parsed]);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        parsed.forEach((d) => next.add(d.id));
        return next;
      });
    } catch (err) {
      console.error(err);
      alert('文件解析失敗，請確認檔案格式是否為 Word/PDF/Markdown/純文字。');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    setMainDocs((prev) => prev.filter((d) => d.id !== id));
    setExtraDocs((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const allDocs = useMemo(() => [...mainDocs, ...extraDocs], [mainDocs, extraDocs]);
  const selectedDocs = useMemo(() => allDocs.filter((d) => selectedIds.has(d.id)), [allDocs, selectedIds]);

  // ---- History / Q&A ----
  const [history, setHistory] = useState<QuestionRecord[]>(loadHistory());
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<QuestionRecord['citations']>([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => saveHistory(history), [history]);

  const handleAsk = async (question: string) => {
    setAsking(true);
    setAskError(null);
    setHasAsked(true);
    setActiveRecordId(null);
    try {
      const result = await askQuestion(settings, question, selectedDocs);
      setAnswer(result.answer);
      setCitations(result.citations);
      const record: QuestionRecord = {
        id: uid('qr'),
        question,
        answer: result.answer,
        citations: result.citations,
        timestamp: Date.now(),
        docIds: selectedDocs.map((d) => d.id),
        docNames: selectedDocs.map((d) => d.name),
      };
      setHistory((prev) => [record, ...prev]);
      setActiveRecordId(record.id);
      setAnswerTab('answer');
    } catch (err) {
      setAskError(err instanceof Error ? err.message : '提問時發生未知錯誤。');
      setAnswer('');
      setCitations([]);
    } finally {
      setAsking(false);
    }
  };

  const handleSelectHistory = (record: QuestionRecord) => {
    setActiveRecordId(record.id);
    setAnswer(record.answer);
    setCitations(record.citations);
    setHasAsked(true);
    setAskError(null);
  };

  const handleClearHistory = () => {
    if (!confirm('確定要清空所有歷史紀錄嗎？')) return;
    setHistory([]);
    setActiveRecordId(null);
  };

  // ---- Mobile overlays ----
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const docSelectors = (
    <>
      <DocumentSelector
        title="主要指引文件"
        category="main"
        docs={mainDocs}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onToggleAll={toggleAll}
        onUpload={handleUpload}
        onRemove={handleRemove}
        loading={docsLoading}
      />
      <DocumentSelector
        title="額外／補充指引文件"
        category="extra"
        docs={extraDocs}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onToggleAll={toggleAll}
        onUpload={handleUpload}
        onRemove={handleRemove}
        loading={docsLoading}
      />
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-[#090d16]">
      <Disclaimer open={disclaimerOpen} onAccept={acceptDisclaimer} />
      <SettingsModal open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={handleSaveSettings} />

      {/* Top bar */}
      <header className="relative flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <BrainCircuit size={16} />
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">DocMind Q&A</span>

          <div className="ml-3 hidden items-center gap-1 rounded-lg bg-slate-100 p-0.5 sm:flex dark:bg-slate-800">
            <button
              onClick={() => setViewMode('qa')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition',
                viewMode === 'qa' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              指引問答
            </button>
            <button
              onClick={() => setViewMode('manual')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition',
                viewMode === 'manual' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'
              )}
            >
              指引文件
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {viewMode === 'qa' && (
            <>
              <button
                onClick={() => setMobileDocsOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 lg:hidden dark:border-slate-700 dark:text-slate-400"
              >
                <FileStack size={15} />
              </button>
              <button
                onClick={() => setMobileHistoryOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 lg:hidden dark:border-slate-700 dark:text-slate-400"
              >
                <HistoryIcon size={15} />
              </button>
            </>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400"
            title="AI 設定"
          >
            <SettingsIcon size={15} />
          </button>
          <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        </div>

        {/* mobile view-mode switch */}
        <div className="absolute left-1/2 top-12 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-slate-100 p-0.5 sm:hidden dark:bg-slate-800">
          <button
            onClick={() => setViewMode('qa')}
            className={cn('rounded-md px-3 py-1 text-xs font-medium', viewMode === 'qa' ? 'bg-white text-indigo-700 dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500')}
          >
            指引問答
          </button>
          <button
            onClick={() => setViewMode('manual')}
            className={cn('rounded-md px-3 py-1 text-xs font-medium', viewMode === 'manual' ? 'bg-white text-indigo-700 dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500')}
          >
            指引文件
          </button>
        </div>
      </header>

      {viewMode === 'manual' ? (
        <main className="min-h-0 flex-1 p-4">
          <ManualViewer chapters={manualChapters} basePath={BASE} />
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,42%)_1fr]">
          {/* Left panel: desktop only */}
          <div className="hidden min-h-0 flex-col gap-3 lg:flex">
            {docSelectors}
            <HistoryPanel history={history} activeId={activeRecordId} onSelect={handleSelectHistory} onClear={handleClearHistory} />
            <ChatInput onSubmit={handleAsk} loading={asking} selectedCount={selectedDocs.length} />
          </div>

          {/* Right panel: desktop always visible; mobile with tabs */}
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 lg:hidden dark:bg-slate-800">
              <button
                onClick={() => setAnswerTab('answer')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium',
                  answerTab === 'answer' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500'
                )}
              >
                <Sparkles size={12} /> 回答
              </button>
              <button
                onClick={() => setAnswerTab('citations')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium',
                  answerTab === 'citations' ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500'
                )}
              >
                <BookOpenText size={12} /> 引用出處 ({citations.length})
              </button>
            </div>

            <div className="hidden min-h-0 flex-1 lg:block">
              <AnswerPanel answer={answer} loading={asking} error={askError} hasAsked={hasAsked} />
            </div>
            <div className="hidden min-h-0 flex-1 lg:block">
              <CitationsPanel citations={citations} hasAsked={hasAsked} />
            </div>

            <div className="min-h-0 flex-1 lg:hidden">
              {answerTab === 'answer' ? (
                <AnswerPanel answer={answer} loading={asking} error={askError} hasAsked={hasAsked} />
              ) : (
                <CitationsPanel citations={citations} hasAsked={hasAsked} />
              )}
            </div>

            <div className="lg:hidden">
              <ChatInput onSubmit={handleAsk} loading={asking} selectedCount={selectedDocs.length} />
            </div>
          </div>
        </main>
      )}

      {/* Mobile overlays */}
      <AnimatePresence>
        {mobileDocsOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-slate-950/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileDocsOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-full space-y-3 overflow-y-auto rounded-t-2xl bg-slate-50 p-4 dark:bg-slate-950"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">選擇文件</span>
                <button onClick={() => setMobileDocsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              {docSelectors}
            </motion.div>
          </motion.div>
        )}

        {mobileHistoryOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-slate-950/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileHistoryOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-slate-50 p-4 dark:bg-slate-950"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">歷史紀錄</span>
                <button onClick={() => setMobileHistoryOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <HistoryPanel
                history={history}
                activeId={activeRecordId}
                onSelect={(r) => {
                  handleSelectHistory(r);
                  setMobileHistoryOpen(false);
                }}
                onClear={handleClearHistory}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

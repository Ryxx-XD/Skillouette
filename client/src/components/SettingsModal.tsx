import React, { useState, useEffect } from 'react';
import { X, Settings, Key, Cpu, RotateCcw, Check, ShieldCheck } from 'lucide-react';
import { AppSettings } from '../types.js';
import { getSettings, updateSettings, resetDatabase } from '../api.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefresh
}) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<AppSettings>({
    llm_provider: 'local',
    model_name: 'gemini-1.5-flash',
    temperature: 0.15
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'local'>('local');
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0.15);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setProvider(s.llm_provider || 'local');
      setModelName(s.model_name || 'gemini-1.5-flash');
      setTemperature(s.temperature ?? 0.15);
      if (s.gemini_api_key) setGeminiKey(s.gemini_api_key);
      if (s.openai_api_key) setOpenaiKey(s.openai_api_key);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const payload: Partial<AppSettings> = {
        llm_provider: provider,
        model_name: modelName,
        temperature
      };
      if (geminiKey && !geminiKey.startsWith('••••')) {
        payload.gemini_api_key = geminiKey.trim();
      }
      if (openaiKey && !openaiKey.startsWith('••••')) {
        payload.openai_api_key = openaiKey.trim();
      }

      await updateSettings(payload);
      setMessage('Settings saved successfully.');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all resume data to the initial Robotics Engineering student seed profile? This will restore the default projects, skills, and sections.')) {
      try {
        await resetDatabase();
        onRefresh();
        onClose();
      } catch (err: any) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h2 className="font-display font-semibold text-white text-base">AI & System Settings</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5">
          {message && (
            <div className="p-3 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              LLM Classification Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('local')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'local'
                    ? 'bg-sky-500/20 border-sky-400 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold">Local Heuristic</span>
                <span className="text-[10px] text-slate-400">Offline & Fast</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'gemini'
                    ? 'bg-sky-500/20 border-sky-400 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold">Google Gemini</span>
                <span className="text-[10px] text-slate-400">Flash 2.0 / 1.5</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'openai'
                    ? 'bg-sky-500/20 border-sky-400 text-white'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold">OpenAI</span>
                <span className="text-[10px] text-slate-400">GPT-4o Mini</span>
              </button>
            </div>
          </div>

          {/* API Key inputs */}
          {provider === 'gemini' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-dark text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Stored locally in server. The app automatically falls back to the smart local classifier if no key is supplied.
              </p>
            </div>
          )}

          {provider === 'openai' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="input-dark text-xs font-mono"
              />
            </div>
          )}

          {/* Model Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                className="input-dark text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Temperature</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="input-dark text-xs font-mono"
              />
            </div>
          </div>

          {/* Restore Seed Database */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Restore Seed Profile</div>
              <div className="text-[11px] text-slate-500">Reset entries to default robotics student data</div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="btn-danger text-xs px-3 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4">
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary text-xs px-5 shadow-sky-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

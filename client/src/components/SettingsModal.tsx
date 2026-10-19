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
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      getSettings().then(s => {
        setSettings(s);
        setProvider(s.llm_provider || 'local');
        setModelName(s.model_name || 'gemini-1.5-flash');
        setTemperature(s.temperature ?? 0.15);
        if (s.gemini_api_key) setGeminiKey(s.gemini_api_key);
        if (s.openai_api_key) setOpenaiKey(s.openai_api_key);
      });
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#171717] bg-[#FFFDF5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#82D9F5] border-2 border-[#171717] text-[#171717] flex items-center justify-center shadow-[2px_2px_0px_#171717]">
              <Settings className="w-4 h-4" />
            </div>
            <h2 className="font-display font-black text-[#171717] text-base">AI & System Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#171717] rounded-md bg-white hover:bg-[#FF8066] text-[#171717] transition shadow-[2px_2px_0px_#171717]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-5 bg-white">
          {message && (
            <div className="p-3 rounded-md bg-[#C6F564]/30 border-2 border-[#171717] text-[#171717] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#171717]">
              <ShieldCheck className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-[#171717] mb-2 uppercase tracking-wider">
              LLM Classification Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('local')}
                className={`p-3 rounded-md border-2 border-[#171717] text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'local'
                    ? 'bg-[#C6F564] text-[#171717] shadow-[3px_3px_0px_#171717]'
                    : 'bg-white text-[#525252] hover:bg-[#F2EFE7] shadow-[2px_2px_0px_#171717]'
                }`}
              >
                <Cpu className="w-4 h-4 text-[#171717]" />
                <span className="text-xs font-bold text-[#171717]">Local Engine</span>
                <span className="text-[10px] font-mono font-semibold text-[#525252]">Offline & Fast</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`p-3 rounded-md border-2 border-[#171717] text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'gemini'
                    ? 'bg-[#82D9F5] text-[#171717] shadow-[3px_3px_0px_#171717]'
                    : 'bg-white text-[#525252] hover:bg-[#F2EFE7] shadow-[2px_2px_0px_#171717]'
                }`}
              >
                <Key className="w-4 h-4 text-[#171717]" />
                <span className="text-xs font-bold text-[#171717]">Google Gemini</span>
                <span className="text-[10px] font-mono font-semibold text-[#525252]">Flash 2.0 / 1.5</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-3 rounded-md border-2 border-[#171717] text-center transition flex flex-col items-center gap-1.5 ${
                  provider === 'openai'
                    ? 'bg-[#B8A5FF] text-[#171717] shadow-[3px_3px_0px_#171717]'
                    : 'bg-white text-[#525252] hover:bg-[#F2EFE7] shadow-[2px_2px_0px_#171717]'
                }`}
              >
                <Key className="w-4 h-4 text-[#171717]" />
                <span className="text-xs font-bold text-[#171717]">OpenAI</span>
                <span className="text-[10px] font-mono font-semibold text-[#525252]">GPT-4o Mini</span>
              </button>
            </div>
          </div>

          {/* API Key inputs */}
          {provider === 'gemini' && (
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
              <p className="text-[11px] text-[#525252] mt-1 font-medium">
                Stored locally in server. The app automatically falls back to the smart local classifier if no key is supplied.
              </p>
            </div>
          )}

          {provider === 'openai' && (
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
          )}

          {/* Model Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#171717] uppercase tracking-wider mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full bg-white border-2 border-[#171717] rounded-md px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none focus:shadow-[2px_2px_0px_#171717]"
              />
            </div>
          </div>

          {/* Restore Seed Database */}
          <div className="pt-3 border-t-2 border-[#171717] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#171717]">Restore Seed Profile</div>
              <div className="text-[11px] text-[#525252] font-medium">Reset entries to default robotics student data</div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="btn-danger text-xs px-3 py-1.5 font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#171717]">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 font-bold">
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary text-xs px-5 font-bold"
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

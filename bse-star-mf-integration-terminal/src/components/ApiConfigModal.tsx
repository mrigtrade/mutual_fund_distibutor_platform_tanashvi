import React, { useState } from 'react';
import { BseCredentials } from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import { X, Server, Key, Shield, CheckCircle, AlertCircle, RefreshCw, Lock } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: BseCredentials;
  onSaveCredentials: (creds: BseCredentials) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials
}) => {
  const [form, setForm] = useState<BseCredentials>({ ...credentials });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    authToken?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await BseApiService.testConnection(form);
      setTestResult({
        success: res.success,
        latencyMs: res.latencyMs,
        message: res.message,
        authToken: res.authToken
      });
      if (res.success) {
        setForm(prev => ({
          ...prev,
          connectionStatus: 'CONNECTED',
          lastTestedAt: new Date().toISOString()
        }));
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err?.message || 'Gateway connection timeout'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveCredentials({
      ...form,
      isConfigured: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-white">BSE StAR MF Gateway Connection</h2>
              <p className="text-xs text-slate-400">Configure official Member credentials and API routing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Environment Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Environment
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  environment: 'uat',
                  customGatewayUrl: 'https://bsestarmfdemo.bseindia.com/StarMFWebAPI/v2'
                }))}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  form.environment === 'uat'
                    ? 'border-amber-400/80 bg-amber-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>UAT Sandbox / Demo</span>
                  {form.environment === 'uat' && <CheckCircle className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Testing endpoint (bsestarmfdemo.bseindia.com)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  environment: 'prod',
                  customGatewayUrl: 'https://bsestarmf.in/StarMFWebAPI/v2'
                }))}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  form.environment === 'prod'
                    ? 'border-emerald-500/80 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  <span>Production Live</span>
                  {form.environment === 'prod' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Real order routing & live settlements (bsestarmf.in)
                </div>
              </button>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Member Code / ARN
              </label>
              <input
                type="text"
                value={form.memberId}
                onChange={(e) => setForm(f => ({ ...f, memberId: e.target.value }))}
                placeholder="e.g. 714114 or ARN-347849"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-sm focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                BSE User ID
              </label>
              <input
                type="text"
                value={form.userId}
                onChange={(e) => setForm(f => ({ ...f, userId: e.target.value }))}
                placeholder="e.g. STARMF_API_USER"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-sm focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Member Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Official BSE Member Password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-sm focus:outline-hidden focus:border-amber-400 pr-9"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                PassKey / API Auth Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.passKey}
                  onChange={(e) => setForm(f => ({ ...f, passKey: e.target.value }))}
                  placeholder="Issued by BSE StAR Tech Desk"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white font-mono text-xs focus:outline-hidden focus:border-amber-400 pr-9"
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Gateway Endpoint URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Gateway Endpoint URL
            </label>
            <input
              type="text"
              value={form.customGatewayUrl || ''}
              onChange={(e) => setForm(f => ({ ...f, customGatewayUrl: e.target.value }))}
              placeholder="https://bsestarmf.in/StarMFWebAPI/v2"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-slate-300 font-mono text-xs focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Test Connection Result Box */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-mono ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{testResult.success ? 'Gateway Acknowledgment OK' : 'Connection Failed'}</span>
                <span className="text-slate-400 font-normal ml-auto">
                  {testResult.latencyMs}ms roundtrip
                </span>
              </div>
              <p>{testResult.message}</p>
              {testResult.authToken && (
                <div className="mt-2 pt-2 border-t border-emerald-500/20 text-slate-400 truncate">
                  Active Session Token: <span className="text-emerald-300">{testResult.authToken}</span>
                </div>
              )}
            </div>
          )}

          {/* IP Whitelisting Warning */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>BSE StAR MF Security Requirements</span>
            </div>
            <p>
              For Live Production access, BSE requires static IP whitelisting on port 443. All API payloads use SOAP/REST encryption with PassKey authentication.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing Gateway...' : 'Ping BSE Server'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer font-semibold"
            >
              Apply Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

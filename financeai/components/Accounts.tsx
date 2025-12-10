
import React, { useState, useRef } from 'react';
import { Account, AccountType, ACCOUNT_TYPES } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { addAccount, deleteAccount } from '../services/storage';
import { processVoiceAccountInput } from '../services/voiceParser';
import { Trash2, Plus, Wallet, CreditCard, Building, Coins, Mic, Square, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AccountsProps {
  accounts: Account[];
}

export const Accounts: React.FC<AccountsProps> = ({ accounts }) => {
  const { currentUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: AccountType.CHECKING,
    initialBalance: ''
  });

  // --- Voice Logic ---
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      setErrorMsg("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcessing = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';
        
        const result = await processVoiceAccountInput(base64String, mimeType);
        
        if (result) {
          setTranscript(result.transcript || "Details processed.");
          setNewAccount(prev => ({
            ...prev,
            name: result.name || prev.name,
            initialBalance: result.initialBalance ? result.initialBalance.toString() : prev.initialBalance,
            type: (result.type as AccountType) || prev.type
          }));
        }
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Processing failed", error);
      setTranscript("Error processing audio.");
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // --- Form Logic ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      await addAccount(currentUser.uid, {
        name: newAccount.name,
        type: newAccount.type,
        initialBalance: parseFloat(newAccount.initialBalance) || 0
      });
      setIsAdding(false);
      setNewAccount({ name: '', type: AccountType.CHECKING, initialBalance: '' });
      setTranscript('');
    } catch (error) {
      console.error("Error adding account:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This will delete the account but may leave orphaned transactions.')) {
      await deleteAccount(id);
    }
  };

  const getIcon = (type: AccountType) => {
    switch(type) {
      case AccountType.CREDIT_CARD: return <CreditCard className="w-5 h-5 text-red-500" />;
      case AccountType.LOAN: return <Building className="w-5 h-5 text-orange-500" />;
      case AccountType.INVESTMENT: return <Coins className="w-5 h-5 text-purple-500" />;
      default: return <Wallet className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Account
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in transition-colors">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Account</h3>
             
             {/* Voice Input Controls */}
             <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-600">
                {isProcessing && <span className="text-xs text-amber-500 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> AI Processing...</span>}
                {transcript && !isProcessing && <span className="text-xs text-gray-500 truncate max-w-[150px]">"{transcript}"</span>}
                {errorMsg && <span className="text-xs text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errorMsg}</span>}
                
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200'
                  }`}
                  title="Use Voice to Fill"
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                </button>
             </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name</label>
              <input 
                type="text" 
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Chase Sapphire"
                value={newAccount.name}
                onChange={e => setNewAccount({...newAccount, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select 
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={newAccount.type}
                onChange={e => setNewAccount({...newAccount, type: e.target.value as AccountType})}
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Balance</label>
              <input 
                type="number" 
                step="0.01"
                required
                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
                value={newAccount.initialBalance}
                onChange={e => setNewAccount({...newAccount, initialBalance: e.target.value})}
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-sm">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group hover:border-blue-200 dark:hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {getIcon(acc.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{acc.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{acc.type}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(acc.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">Current Balance</p>
              <p className={`text-xl font-bold ${acc.currentBalance && acc.currentBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                ${(acc.currentBalance ?? acc.initialBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Started at ${(acc.initialBalance).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {accounts.length === 0 && !isAdding && (
           <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400">
             <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
             <p>No accounts yet. Click "Add Account" to get started.</p>
           </div>
        )}
      </div>
    </div>
  );
};

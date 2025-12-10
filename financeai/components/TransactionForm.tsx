
import React, { useState, useRef } from 'react';
import { Account, TransactionType, CATEGORIES } from '../types';
import { addTransaction } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { processVoiceInput } from '../services/voiceParser';
import { X, Mic, Square, Loader2, Sparkles, Check, AlertCircle } from 'lucide-react';

interface TransactionFormProps {
  accounts: Account[];
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, onClose }) => {
  const { currentUser } = useAuth();
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: TransactionType.EXPENSE,
    category: CATEGORIES[0],
    accountId: accounts[0]?.id || '',
    toAccountId: '' // For transfers
  });

  // --- Voice Recording Logic ---

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
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
        
        // Create Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome/Firefox standard
        await handleAudioProcessing(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript(''); // Clear previous
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg("Microphone permission denied. Please allow access in your browser settings.");
      } else {
        setErrorMsg("Could not access microphone. " + (err.message || ""));
      }
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
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';

        // Send to Gemini
        const result = await processVoiceInput(base64String, mimeType);
        
        // Update Form
        if (result) {
          setTranscript(result.transcript || "Audio processed successfully.");
          
          setFormData(prev => ({
            ...prev,
            amount: result.amount ? result.amount.toString() : prev.amount,
            category: result.category && CATEGORIES.includes(result.category) ? result.category : prev.category,
            description: result.description || prev.description,
            type: (result.type as TransactionType) || prev.type,
          }));
        }
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Processing failed", error);
      setTranscript("Error processing audio. Please try again.");
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // --- Form Submission ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await addTransaction(currentUser.uid, {
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        accountId: formData.accountId,
        toAccountId: formData.type === TransactionType.TRANSFER ? formData.toAccountId : undefined
      });
      onClose();
    } catch (error) {
      console.error("Error adding transaction", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-colors flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
            New Transaction
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Voice Input Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 border-b border-blue-100 dark:border-blue-800 transition-colors">
           <div className="flex flex-col items-center justify-center space-y-4">
              
              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-200 dark:ring-red-900/50' 
                    : isProcessing
                    ? 'bg-amber-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <Square className="w-8 h-8 text-white relative z-10 fill-current" />
                  </>
                ) : isProcessing ? (
                   <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              
              {/* Status Text */}
              <div className="text-center w-full min-h-[3rem]">
                {errorMsg ? (
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errorMsg}
                  </div>
                ) : isRecording ? (
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 animate-pulse">
                    Listening... tap to stop
                  </p>
                ) : isProcessing ? (
                  <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Processing with Gemini AI...</span>
                  </div>
                ) : transcript ? (
                  <div className="animate-fade-in bg-white dark:bg-gray-700/50 rounded-lg p-2 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase font-bold">Transcript</p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 italic leading-snug">
                      "{transcript}"
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tap the mic to describe your spending
                  </p>
                )}
              </div>
           </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
               <select
                 className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 value={formData.type}
                 onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
               >
                 <option value={TransactionType.INCOME}>Income</option>
                 <option value={TransactionType.EXPENSE}>Expense</option>
                 <option value={TransactionType.TRANSFER}>Transfer</option>
               </select>
             </div>
             <div>
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
               <input
                 type="date"
                 required
                 className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
             </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <div className="relative">
               <input
                type="text"
                required
                className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Grocery Shopping"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              {transcript && (
                 <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-pulse" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source Account</label>
               <select
                 className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm"
                 required
                 value={formData.accountId}
                 onChange={e => setFormData({...formData, accountId: e.target.value})}
               >
                 <option value="" disabled>Select Account</option>
                 {accounts.map(acc => (
                   <option key={acc.id} value={acc.id}>{acc.name}</option>
                 ))}
               </select>
             </div>
             
             {formData.type === TransactionType.TRANSFER ? (
               <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
                  <select
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm"
                    required
                    value={formData.toAccountId}
                    onChange={e => setFormData({...formData, toAccountId: e.target.value})}
                  >
                    <option value="" disabled>Select Account</option>
                    {accounts.filter(a => a.id !== formData.accountId).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
               </div>
             ) : (
               <div>
                 <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                 <select
                   className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                 >
                   {CATEGORIES.map(c => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
               </div>
             )}
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center">
              <Check className="w-5 h-5 mr-2" /> Confirm Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

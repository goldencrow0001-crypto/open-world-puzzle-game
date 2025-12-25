import React, { useState } from 'react';
import { Puzzle } from '../types';
import { Brain, Globe, ExternalLink, XCircle } from 'lucide-react';
import { playSound } from '../services/audioService';

interface PuzzleModalProps {
  puzzle: Puzzle;
  onSolve: (success: boolean) => void;
  onClose: () => void;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({ puzzle, onSolve, onClose }) => {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = () => {
    // Normalize answer
    const normalizedInput = answer.toLowerCase().trim();
    const normalizedCorrect = puzzle.answer.toLowerCase().trim();

    // Simple fuzzy match or direct match
    if (normalizedInput === normalizedCorrect || normalizedInput.includes(normalizedCorrect)) {
      playSound('success');
      setFeedback('CORRECT');
      setTimeout(() => onSolve(true), 1000);
    } else {
      playSound('error');
      setFeedback('INCORRECT');
      // Punishment? Just message for now.
    }
  };

  const handleOptionClick = (option: string) => {
    playSound('click');
    setAnswer(option);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
            {puzzle.type === 'reality_check' ? <Globe size={20} /> : <Brain size={20} />}
            {puzzle.type === 'reality_check' ? 'REALITY ANCHOR DETECTED' : 'LOGIC GATE DETECTED'}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <p className="text-lg text-slate-200 mb-6 font-medium leading-relaxed">
            {puzzle.question}
          </p>

          {/* Options for multiple choice */}
          {puzzle.options && puzzle.options.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 mb-4">
              {puzzle.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(opt)}
                  className={`p-3 text-left rounded border transition-all ${
                    answer === opt 
                      ? 'bg-cyan-900/50 border-cyan-400 text-cyan-100' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter solution code..."
              className="w-full p-3 bg-black border border-slate-600 rounded text-cyan-400 font-mono focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          )}

          {/* Feedback */}
          {feedback && (
            <div className={`text-center font-bold text-xl p-2 rounded animate-pulse ${
              feedback === 'CORRECT' ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'
            }`}>
              {feedback}
            </div>
          )}

          {/* Grounding Sources */}
          {puzzle.groundingUrls && puzzle.groundingUrls.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Source Signals</h4>
              <ul className="space-y-1">
                {puzzle.groundingUrls.map((url, i) => (
                  <li key={i}>
                    <a 
                      href={url.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-600 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink size={10} />
                      {url.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!answer}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all"
          >
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
};
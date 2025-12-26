import React, { useState, useEffect } from 'react';
import { Logo, DEFAULT_CTA } from './constants';
import { ViewState, FinalResponse, CTAConfig } from './types';
import { analyzeInput, generateHealingResponse } from './services/geminiService';
import { db } from './services/database';
import StickyCTA from './components/StickyCTA';
import { Search, Loader2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinalResponse | null>(null);
  const [ctaConfig, setCtaConfig] = useState<CTAConfig>(DEFAULT_CTA);
  
  useEffect(() => {
    // Load CTA config on mount
    db.config.get().then(setCtaConfig);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      // 1. Analyze Input (Symptom + Lateralization)
      const analysis = await analyzeInput(input);
      console.log("Analysis:", analysis);

      // 2. Search DB
      const dbMatch = await db.diseases.search(analysis.symptom);
      
      // 3. Generate Final Response
      const finalResponse = await generateHealingResponse(analysis, dbMatch);
      
      setResult(finalResponse);
      setView(ViewState.RESULT);
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao buscar sua cura. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Render Main User View (Home + Result)
  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      {/* Header */}
      <header className="p-6 flex justify-center md:justify-start items-center max-w-6xl mx-auto w-full">
        <div onClick={() => { setView(ViewState.HOME); setResult(null); setInput(''); }} className="cursor-pointer text-brand-black w-32 md:w-48">
          <Logo className="w-full h-auto text-brand-black" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center px-4 pt-10 pb-32 max-w-4xl mx-auto w-full">
        
        {/* Search Section (Always visible but moves up on result) */}
        <div className={`transition-all duration-700 w-full max-w-2xl ${view === ViewState.RESULT ? 'mb-8' : 'mb-0 mt-10 md:mt-20'}`}>
          {view === ViewState.HOME && (
            <div className="text-center mb-10 animate-fadeIn">
              <h1 className="text-4xl md:text-5xl font-serif text-brand-black mb-4 leading-tight">
                O que seu corpo <br/> está dizendo?
              </h1>
              <p className="text-brand-gray text-lg md:text-xl font-light">
                Digite o sintoma e descubra a origem emocional.
              </p>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Dor no ombro direito..."
              className="w-full p-5 pl-6 pr-14 text-lg rounded-full border-2 border-brand-lightGray/50 bg-white shadow-sm focus:shadow-xl focus:border-brand-red outline-none transition-all placeholder:text-brand-lightGray text-brand-black"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-red text-white p-3 rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
            </button>
          </form>
        </div>

        {/* Result Section */}
        {view === ViewState.RESULT && result && (
          <div className="w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-t-8 border-brand-red animate-slideUp">
            <h2 className="text-3xl font-serif text-brand-black mb-2 capitalize border-b pb-4 border-brand-lightGray/20">
              {result.symptom}
            </h2>
            
            <div className="prose prose-lg text-brand-gray mt-6 font-serif leading-relaxed whitespace-pre-line">
              {result.fullText.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky CTA (Only visible when result is shown) */}
      {view === ViewState.RESULT && (
        <StickyCTA config={ctaConfig} />
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { parsePdfContent } from '../services/geminiService';
import { Disease, CTAConfig } from '../types';
import { Trash2, Plus, Upload, Save, X } from 'lucide-react';

const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [cta, setCta] = useState<CTAConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfText, setPdfText] = useState("");
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [d, c] = await Promise.all([db.diseases.getAll(), db.config.get()]);
    setDiseases(d);
    setCta(c);
    setLoading(false);
  };

  const handleProcessPdf = async () => {
    if (!pdfText) return;
    setIsProcessingPdf(true);
    try {
      const extracted = await parsePdfContent(pdfText);
      for (const item of extracted) {
        if (item.name && item.content) {
          // @ts-ignore
          await db.diseases.create(item);
        }
      }
      await loadData();
      setPdfText("");
      alert("Doenças importadas com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao processar texto");
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza?")) {
      await db.diseases.delete(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream p-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-serif text-brand-black">Painel Administrativo</h1>
          <button onClick={onLogout} className="text-brand-red underline">Sair</button>
        </div>

        {/* CTA Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-brand-lightGray/30">
          <h2 className="text-2xl font-serif mb-4 text-brand-gray">Configuração Global da CTA</h2>
          {cta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                className="p-3 border rounded border-brand-lightGray" 
                value={cta.preText} 
                onChange={e => setCta({...cta, preText: e.target.value})}
                placeholder="Texto de Chamada"
              />
              <input 
                className="p-3 border rounded border-brand-lightGray" 
                value={cta.buttonText} 
                onChange={e => setCta({...cta, buttonText: e.target.value})}
                placeholder="Texto do Botão"
              />
              <input 
                className="p-3 border rounded border-brand-lightGray" 
                value={cta.buttonLink} 
                onChange={e => setCta({...cta, buttonLink: e.target.value})}
                placeholder="Link"
              />
            </div>
          )}
          <button 
            onClick={() => cta && db.config.update(cta)}
            className="mt-4 bg-brand-black text-white px-6 py-2 rounded flex items-center gap-2"
          >
            <Save size={18} /> Salvar Configuração
          </button>
        </div>

        {/* PDF Upload Simulator */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-brand-lightGray/30">
          <h2 className="text-2xl font-serif mb-4 text-brand-gray">Importação em Massa (IA)</h2>
          <p className="text-sm text-gray-500 mb-2">Cole o texto do PDF aqui para a IA processar e cadastrar automaticamente.</p>
          <textarea 
            className="w-full h-32 p-3 border rounded mb-4" 
            placeholder="Cole o conteúdo do livro aqui..."
            value={pdfText}
            onChange={e => setPdfText(e.target.value)}
          />
          <button 
            onClick={handleProcessPdf}
            disabled={isProcessingPdf || !pdfText}
            className="bg-brand-red text-white px-6 py-3 rounded flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessingPdf ? "Processando com Gemini..." : <><Upload size={18} /> Processar Texto</>}
          </button>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-lightGray/30">
          <h2 className="text-2xl font-serif mb-6 text-brand-gray">Doenças Cadastradas ({diseases.length})</h2>
          <div className="space-y-4">
            {diseases.map(d => (
              <div key={d.id} className="flex justify-between items-start p-4 border-b border-brand-lightGray/20">
                <div>
                  <h3 className="font-bold text-lg text-brand-black">{d.name}</h3>
                  <p className="text-brand-gray text-sm line-clamp-2">{d.content}</p>
                  <div className="flex gap-2 mt-2">
                    {d.tags.map(t => <span key={t} className="bg-brand-cream text-xs px-2 py-1 rounded text-brand-gray">#{t}</span>)}
                    {d.hasLateralization && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded">Lateralidade</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} className="text-brand-red hover:bg-red-50 p-2 rounded">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
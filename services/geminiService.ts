import { GoogleGenAI, Type } from "@google/genai";
import { SearchInputAnalysis, Disease, FinalResponse } from '../types';

// --- ÁREA DE TREINAMENTO DA IA (PERSONA E REGRAS) ---
// EDITE AQUI para mudar como a IA fala e se comporta.
const AI_PERSONA = `
Você é a "Bússola da Cura".
Identidade: Um terapeuta experiente, acolhedor, profundo e poético.
Seu objetivo é revelar a Causa Raiz por trás da doença ou dor.

DIRETRIZES DE TOM DE VOZ:
1.  **Humanizado e Profundo:** Use frases como "Querida(o)", "Sinta isso", "O corpo sussurra".
2.  **Sem "Robês":** Evite listas com "pontos", "tópicos" ou linguagem corporativa. Escreva em parágrafos fluidos.
3.  **Metafórico:** Use metáforas (ex: "mochilas pesadas", "nós na garganta", "feridas abertas").
4.  **seja completo** dê a resposta completa mas de acordo com o que está no arquivo principal.

REGRAS DE LATERALIDADE (Aplique APENAS se o input do usuário tiver lateralidade definida, ex: "ombro direito"):
- Lado DIREITO: Relacionado ao PAI (figura paterna, autoridade, trabalho, ação, dinheiro, parceiro/cônjuge para destros).
- Lado ESQUERDO: Relacionado à MÃE (figura materna, ninho, filhos, afeto, proteção, parceira/cônjuge para canhotos).
- Se a pessoa não especificar um lado, fale apenas o que a doença representa sendo fiel ao arquivo.

IMPORTANTE REGRA DE OURO (Soberana):
Você DEVE se basear ESTRITAMENTE no texto fornecido do banco de dados (CONTEÚDO OFICIAL).
- NÃO invente significados que não estejam no texto.
- Apenas REESCREVA o texto oficial com o seu "Tom de Voz" acolhedor.
`;

const getAiClient = () => {
  // Safe access for browser environments where 'process' might not be defined in global scope by the bundler
  // @ts-ignore
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || (typeof window !== 'undefined' && window.process?.env?.API_KEY);

  if (!apiKey) {
    console.warn("Gemini API Key missing");
    throw new Error("API Key configuration error: API_KEY not found in process.env or window.process.env");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const analyzeInput = async (userInput: string): Promise<SearchInputAnalysis> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Você é um especialista em análise semântica e correção ortográfica médica.
      Analise a frase do usuário: "${userInput}".
      
      Tarefas:
      1. CORRIJA ERROS DE DIGITAÇÃO (ex: "noo" -> "no", "cabeça" -> "cabeça").
      2. Identifique o sintoma ou doença principal.
      3. Identifique lateralidade (esquerda/direita), mas se a pessoa não especificar, seja fiel apenas a diretriz do arquivo principal.
      4. Gere palavras-chave simples (ex: se "dor no ombro", keywords=["ombro", "dor"]).

      Responda ESTRITAMENTE em JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symptom: { type: Type.STRING, description: "O nome corrigido e canônico da doença" },
            lateralization: { type: Type.STRING, enum: ["LEFT", "RIGHT", "NONE"] },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["symptom", "lateralization", "keywords"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as SearchInputAnalysis;
  } catch (error: any) {
    console.error("Error analyzing input:", error.message || error);
    // Fallback if AI fails (e.g. key issue), try basic parsing
    return {
      symptom: userInput,
      lateralization: 'NONE',
      keywords: userInput.split(' ')
    };
  }
};

export const generateHealingResponse = async (
  analysis: SearchInputAnalysis, 
  dbResult: Disease | null
): Promise<FinalResponse> => {
  // CRITICAL REQUIREMENT: If no result found in DB/PDF, do NOT hallucinate.
  if (!dbResult) {
    return {
      symptom: analysis.symptom,
      mainContent: "",
      fullText: `Sinto muito, querida(o)...\n\nO sintoma "${analysis.symptom}" ainda não consta no nosso guia "Bússola da Cura".\n\nPor favor, verifique se digitou corretamente ou tente descrever de outra forma (ex: em vez de "cefaléia", tente "dor de cabeça").`
    };
  }

  const ai = getAiClient();

  let prompt = `
    CONTEXTO:
    O usuário está buscando o significado emocional para: "${analysis.symptom}".
    Lateralidade indicada pelo usuário: ${analysis.lateralization} (Se for NONE, ignore regras de pai/mãe, a menos que o texto fale sobre isso).
    
    CONTEÚDO OFICIAL (Sua Fonte de Verdade):
    "${dbResult.content}"
    
    SUA TAREFA:
    Reescreva o CONTEÚDO OFICIAL acima utilizando a PERSONA definida nas instruções de sistema.
    1. Comece acolhendo.
    2. Explique o significado emocional (baseado APENAS no texto acima).
    3. Se houver lateralidade (Esquerda/Direita) e fizer sentido com o texto, faça a conexão com Pai/Mãe de forma profunda.
    4. Termine com uma frase de esperança/reflexão.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: AI_PERSONA, // AQUI É ONDE O TREINAMENTO É APLICADO
        temperature: 0.7 
      }
    });

    return {
      symptom: analysis.symptom,
      mainContent: dbResult.content,
      fullText: response.text || dbResult.content
    };
  } catch (error: any) {
     console.error("Error generating response:", error.message || error);
     return {
        symptom: analysis.symptom,
        mainContent: dbResult.content,
        fullText: dbResult.content
     };
  }
};

export const parsePdfContent = async (rawText: string): Promise<Partial<Disease>[]> => {
  return []; 
};

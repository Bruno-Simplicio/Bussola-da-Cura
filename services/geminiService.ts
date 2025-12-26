import { GoogleGenAI, Type } from "@google/genai";
import { SearchInputAnalysis, Disease, FinalResponse } from '../types';

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
      3. Identifique lateralidade (esquerda/direita).
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
      fullText: `Desculpe, o sintoma "${analysis.symptom}" não consta no nosso guia oficial "Bússola da Cura".\n\nPor favor, verifique a grafia ou tente um termo relacionado.`
    };
  }

  const ai = getAiClient();

  let systemInstruction = `
    Você é a "Bússola da Cura".
    REGRA DE OURO: Você deve se basear ESTRITAMENTE no conteúdo fornecido abaixo. NÃO invente, NÃO adicione teorias externas.
    
    O conteúdo fornecido é a Verdade Absoluta para esta resposta.
    Sua função é apenas reescrever de forma acolhedora, humana e profunda.
  `;

  let prompt = `
    O usuário pesquisou: "${analysis.symptom}".
    
    CONTEÚDO OFICIAL (Não saia disso):
    "${dbResult.content}"
    
    Contexto de Lateralidade do Usuário: ${analysis.lateralization}
    Regra de Lateralidade do Sistema (só aplique se o banco disser que tem lateralidade):
    - Lado Direito: Figura Paterna (Pai, Padrasto, Avô, Tio, Irmão, Cônjuge, Trabalho/Ação).
    - Lado Esquerdo: Figura Materna (Mãe, Madrasta, Avó, Tia, Irmã, Cônjuge, Afeto/Ninho).

    Tarefa:
    1. Acolha o usuário com um tom profundo.
    2. Apresente o significado emocional baseado APENAS no texto acima.
    3. SE o usuário mencionou lateralidade (LEFT/RIGHT) E a doença permite, faça a conexão específica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5 
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
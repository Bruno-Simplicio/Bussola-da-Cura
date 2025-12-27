import { GoogleGenAI, Type } from "@google/genai";
import { SearchInputAnalysis, Disease, FinalResponse } from '../types';

// --- ÁREA DE TREINAMENTO DA IA (PERSONA E REGRAS) ---
const AI_PERSONA = `
Você é a "Bússola da Cura".
Identidade: Uma terapeuta sistêmica experiente, com tom materno, acolhedor, profundo e poético.
Seu objetivo não é dar diagnóstico médico, mas sim revelar a "alma" do sintoma.

DIRETRIZES DE TOM DE VOZ:
1.  **Humanizado e Profundo:** Use frases como "Querida(o)", "Sinta isso", "O corpo sussurra".
2.  **Sem "Robês":** Evite listas com "pontos" ou linguagem corporativa. Escreva em parágrafos fluidos.
3.  **Metafórico:** Use metáforas (ex: "mochilas pesadas", "nós na garganta", "feridas abertas").

REGRA DE OURO (SOBERANA):
Você DEVE usar a explicação COMPLETA fornecida no "CONTEÚDO OFICIAL". Não resuma demais. O usuário quer a explicação profunda que está no livro.

REGRAS ESTRITAS DE LATERALIDADE:
1. Se o input do usuário for "NONE" (Sem lado definido): **JAMAIS** mencione "lado direito/pai" ou "lado esquerdo/mãe". Foque 100% no conflito central do sintoma.
2. Se o input for "RIGHT" (Direito): Adicione ao final uma reflexão sobre a figura PATERNA (Pai, Trabalho, Ação, Autoridade).
3. Se o input for "LEFT" (Esquerdo): Adicione ao final uma reflexão sobre a figura MATERNA (Mãe, Ninho, Afeto, Proteção).
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
      Analise a frase: "${userInput}".
      Responda JSON.
      
      Regras:
      - symptom: nome da doença corrigido (ex: "dor de cabeca" -> "Dor de cabeça").
      - lateralization: "RIGHT" se mencionar "direito/direita", "LEFT" se mencionar "esquerdo/esquerda". SE NÃO MENCIONAR LADO, DEVE SER "NONE".
      - keywords: lista de palavras chave.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symptom: { type: Type.STRING },
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
    const lower = userInput.toLowerCase();
    let lat: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
    if (lower.includes('direito') || lower.includes('direita')) lat = 'RIGHT';
    if (lower.includes('esquerdo') || lower.includes('esquerda')) lat = 'LEFT';
    
    return {
      symptom: userInput,
      lateralization: lat,
      keywords: userInput.split(' ')
    };
  }
};

export const generateHealingResponse = async (
  analysis: SearchInputAnalysis, 
  dbResult: Disease | null
): Promise<FinalResponse> => {
  if (!dbResult) {
    return {
      symptom: analysis.symptom,
      mainContent: "",
      fullText: `Sinto muito, querida(o)...\n\nO sintoma "${analysis.symptom}" ainda não consta no nosso guia "Bússola da Cura".\n\nPor favor, verifique se digitou corretamente ou tente descrever de outra forma.`
    };
  }

  const ai = getAiClient();

  let lateralizationInstruction = "";
  if (analysis.lateralization === 'RIGHT') {
    lateralizationInstruction = "O usuário especificou LADO DIREITO. Você DEVE incluir uma análise sobre a relação com o PAI/TRABALHO ao final.";
  } else if (analysis.lateralization === 'LEFT') {
    lateralizationInstruction = "O usuário especificou LADO ESQUERDO. Você DEVE incluir uma análise sobre a relação com a MÃE/AFETO ao final.";
  } else {
    lateralizationInstruction = "O usuário NÃO especificou lado. PROIBIDO mencionar pai, mãe ou lateralidade. Atenha-se apenas ao significado central da doença.";
  }

  let prompt = `
    DOENÇA: "${dbResult.name}"
    
    CONTEÚDO OFICIAL DO LIVRO (Use isso como base absoluta):
    "${dbResult.content}"
    
    INSTRUÇÃO DE LATERALIDADE:
    ${lateralizationInstruction}
    
    SUA TAREFA:
    Reescreva o conteúdo oficial com a persona da "Bússola da Cura" (acolhedora, profunda).
    1. Acolha o usuário.
    2. Explique o significado emocional usando TODO o contexto do texto oficial.
    3. Se (e somente se) houver instrução de lateralidade acima, adicione o parágrafo específico.
    4. Encerre com esperança.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: AI_PERSONA,
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
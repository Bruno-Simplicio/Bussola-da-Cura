import { Disease, CTAConfig } from '../types';
import { DEFAULT_CTA } from '../constants';

// This mimics the Supabase table structure
let MOCK_DISEASES: Disease[] = [
  {
    id: '1',
    name: 'Dor de Cabeça',
    content: 'A dor de cabeça, em geral, representa uma invalidação do eu. É uma autocrítica severa, onde o intelecto tenta controlar a intuição. Frequentemente associada ao medo de ser criticado ou de não corresponder às expectativas.',
    tags: ['cabeça', 'controle', 'intelecto'],
    hasLateralization: false
  },
  {
    id: '2',
    name: 'Joelho',
    content: 'Os joelhos representam nosso orgulho e o ego. Problemas nos joelhos indicam dificuldade em se dobrar, em aceitar, medo de perder o controle ou de ceder. É a inflexibilidade diante das mudanças da vida.',
    tags: ['joelho', 'articulação', 'perna', 'orgulho'],
    hasLateralization: true
  },
  {
    id: '3',
    name: 'Estômago',
    content: 'O estômago digere as ideias e situações. Problemas aqui indicam medo, pavor do novo e incapacidade de assimilar o novo. "Não consigo engolir essa situação".',
    tags: ['estômago', 'digestão', 'barriga'],
    hasLateralization: false
  }
];

let MOCK_CTA: CTAConfig = { ...DEFAULT_CTA };

// Simulation of Supabase Client functions
export const mockDb = {
  diseases: {
    search: async (term: string): Promise<Disease | null> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const lowerTerm = term.toLowerCase();
      return MOCK_DISEASES.find(d => 
        d.name.toLowerCase().includes(lowerTerm) || 
        d.tags.some(t => lowerTerm.includes(t))
      ) || null;
    },
    getAll: async (): Promise<Disease[]> => {
      return [...MOCK_DISEASES];
    },
    create: async (disease: Omit<Disease, 'id'>): Promise<Disease> => {
      const newDisease = { ...disease, id: Math.random().toString(36).substr(2, 9) };
      MOCK_DISEASES.push(newDisease);
      return newDisease;
    },
    delete: async (id: string): Promise<void> => {
      MOCK_DISEASES = MOCK_DISEASES.filter(d => d.id !== id);
    }
  },
  config: {
    get: async (): Promise<CTAConfig> => {
      return MOCK_CTA;
    },
    update: async (config: CTAConfig): Promise<void> => {
      MOCK_CTA = config;
    }
  }
};
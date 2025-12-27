import { supabase } from './supabaseClient';
import { Disease, CTAConfig } from '../types';
import { DEFAULT_CTA } from '../constants';
import { searchLocalDiseases, getLocalDiseases } from './localParser';

// Helper to map DB column names (Portuguese) to App types (English)
const mapDisease = (data: any): Disease => ({
  id: data.id,
  name: data.nome,
  content: data.resposta_padrao,
  tags: data.tags || [],
  hasLateralization: data.lateralidade || false
});

export const db = {
  diseases: {
    search: async (term: string, lateralization: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE'): Promise<Disease | null> => {
      // 1. Try Supabase
      try {
        const { data, error } = await supabase
          .from('doencas')
          .select('*')
          .ilike('nome', `%${term}%`)
          .limit(1);

        if (!error && data && data.length > 0) {
          return mapDisease(data[0]);
        }
      } catch (e) {
        console.warn("Supabase unavailable, using local fallback");
      }

      // 2. Fallback to Local Data with Lateralization Logic
      console.log(`Searching local database for: "${term}" with lateralization: ${lateralization}`);
      return searchLocalDiseases(term, lateralization);
    },

    getAll: async (): Promise<Disease[]> => {
      try {
        const { data, error } = await supabase
          .from('doencas')
          .select('*')
          .order('nome', { ascending: true });

        if (!error && data) {
          return data.map(mapDisease);
        }
      } catch (e) {
        console.warn("Supabase unavailable");
      }
      return getLocalDiseases();
    },

    create: async (disease: Omit<Disease, 'id'>): Promise<Disease> => {
      // Create only works on Supabase. If it fails, it fails.
      const { data, error } = await supabase
        .from('doencas')
        .insert({
          nome: disease.name,
          resposta_padrao: disease.content,
          tags: disease.tags,
          lateralidade: disease.hasLateralization
        })
        .select()
        .single();

      if (error) throw error;
      return mapDisease(data);
    },
    delete: async (id: string): Promise<void> => {
      if (id.startsWith('local-')) return; // Cannot delete local
      const { error } = await supabase
        .from('doencas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  },
  config: {
    get: async (): Promise<CTAConfig> => {
      try {
        const { data, error } = await supabase
          .from('cta_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (data) {
          return {
            preText: data.frase_antecedente,
            buttonText: data.texto_botao,
            buttonLink: data.link_botao
          };
        }
      } catch (e) {
        console.warn('Config fetch error, using default');
      }
      return DEFAULT_CTA;
    },
    update: async (config: CTAConfig): Promise<void> => {
      try {
        const { data: existing } = await supabase.from('cta_config').select('id').limit(1);
        
        const payload = {
          frase_antecedente: config.preText,
          texto_botao: config.buttonText,
          link_botao: config.buttonLink
        };

        if (existing && existing.length > 0) {
          await supabase.from('cta_config').update(payload).eq('id', existing[0].id);
        } else {
          await supabase.from('cta_config').insert(payload);
        }
      } catch (error) {
        console.error("Error updating config:", error);
        alert("Erro ao salvar configuração (Supabase indisponível).");
      }
    }
  }
};
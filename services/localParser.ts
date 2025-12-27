import { Disease } from '../types';
import { RAW_BOOK_CONTENT } from '../data/bookData';

// Helper to normalize strings (remove accents, lowercase)
const normalize = (str: string) => 
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const getLocalDiseases = (): Disease[] => {
  const diseases: Disease[] = [];
  // Split by "Number. " (e.g. "1. ", "150. ")
  const entries = RAW_BOOK_CONTENT.split(/\n(?=\d+\.)/g); 

  entries.forEach(entry => {
    const nameMatch = entry.match(/^\d+\.\s*(.+?)(\n|$)/);
    if (!nameMatch) return;

    const name = nameMatch[1].trim();
    
    // Capture content: From end of name line until "CTA:" or End of entry.
    // We WANT to include "Obs:" because it contains the official lateralization meaning.
    // We want to EXCLUDE "CTA:" because the app handles that.
    const contentMatch = entry.match(/^\d+\..+?\n([\s\S]+?)(?=\nCTA:|$)/);
    
    // Clean up content: remove CTA lines if regex missed them, trim whitespace
    let content = contentMatch ? contentMatch[1].trim() : "";
    content = content.replace(/CTA:[\s\S]*$/, '').trim();

    const hasLateralization = entry.toLowerCase().includes('lado direito') || entry.toLowerCase().includes('lado esquerdo');

    // Generate tags from name
    const tags = normalize(name).split(' ').filter(w => w.length > 2);

    diseases.push({
      id: `local-${Math.random().toString(36).substr(2, 9)}`,
      name,
      content,
      tags,
      hasLateralization
    });
  });

  return diseases;
};

export const searchLocalDiseases = (term: string, lateralization: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE'): Disease | null => {
  const all = getLocalDiseases();
  const normalizedTerm = normalize(term);
  
  // Split input into tokens (e.g. "dor no ombro" -> ["dor", "ombro"])
  const searchTokens = normalizedTerm.split(/\s+/).filter(t => t.length > 2 && t !== 'dor'); 
  
  let bestMatch: Disease | null = null;
  let maxScore = -Infinity; // Start very low to allow negative scores

  all.forEach(disease => {
    let score = 0;
    const normName = normalize(disease.name);

    // 1. Base Score: Exact substring match
    if (normName.includes(normalizedTerm)) score += 50;

    // 2. Token Match
    searchTokens.forEach(token => {
      if (normName.includes(token)) score += 10;
      // Singular/Plural check (very basic)
      if (token.endsWith('s') && normName.includes(token.slice(0, -1))) score += 8;
      if (!token.endsWith('s') && normName.includes(token + 's')) score += 8;
    });

    // 3. LATERALIZATION PENALTY / BOOST (CRITICAL FIX)
    // If user did NOT specify a side (NONE), punish specific side entries.
    // If user DID specify a side, boost that side and punish the other.
    
    const isDiseaseRight = normName.includes('direito') || normName.includes('direita');
    const isDiseaseLeft = normName.includes('esquerdo') || normName.includes('esquerda');
    const isDiseaseGeneric = !isDiseaseRight && !isDiseaseLeft;

    if (lateralization === 'NONE') {
      // User said "Dor no ombro". We prefer "Dor nos ombros" (Generic).
      // We punish "Dor no ombro direito".
      if (isDiseaseRight || isDiseaseLeft) {
        score -= 100; // Heavy penalty for unrequested lateralization
      }
    } else if (lateralization === 'RIGHT') {
      // User said "Dor no ombro direito".
      if (isDiseaseRight) score += 50; // Boost correct side
      if (isDiseaseLeft) score -= 100; // Punish wrong side
    } else if (lateralization === 'LEFT') {
      // User said "Dor no ombro esquerdo".
      if (isDiseaseLeft) score += 50; // Boost correct side
      if (isDiseaseRight) score -= 100; // Punish wrong side
    }

    if (score > maxScore && score > 0) {
      maxScore = score;
      bestMatch = disease;
    }
  });

  return bestMatch;
};
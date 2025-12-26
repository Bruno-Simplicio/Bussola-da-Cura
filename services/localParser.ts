import { Disease } from '../types';
import { RAW_BOOK_CONTENT } from '../data/bookData';

// Helper to normalize strings (remove accents, lowercase)
const normalize = (str: string) => 
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const getLocalDiseases = (): Disease[] => {
  const diseases: Disease[] = [];
  const entries = RAW_BOOK_CONTENT.split(/\n(?=\d+\.)/g); 

  entries.forEach(entry => {
    const nameMatch = entry.match(/^\d+\.\s*(.+?)(\n|$)/);
    if (!nameMatch) return;

    const name = nameMatch[1].trim();
    // Everything between name and "Obs:" is content
    const contentMatch = entry.match(/^\d+\..+?\n([\s\S]+?)(?=\nObs:|$)/);
    const content = contentMatch ? contentMatch[1].trim() : "";
    
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

export const searchLocalDiseases = (term: string): Disease | null => {
  const all = getLocalDiseases();
  const normalizedTerm = normalize(term);
  
  // 1. Exact Match (Best)
  const exact = all.find(d => normalize(d.name) === normalizedTerm);
  if (exact) return exact;

  // 2. Contains Match (Good)
  const contains = all.find(d => normalize(d.name).includes(normalizedTerm));
  if (contains) return contains;

  // 3. Smart Keyword/Score Match (Fallback)
  // Split input into tokens (e.g. "dor no ombro" -> ["dor", "ombro"])
  const searchTokens = normalizedTerm.split(/\s+/).filter(t => t.length > 2 && t !== 'dor'); 
  
  let bestMatch: Disease | null = null;
  let maxScore = 0;

  all.forEach(disease => {
    let score = 0;
    const normName = normalize(disease.name);

    // If the disease name contains the search term exactly
    if (normName.includes(normalizedTerm)) score += 50;

    // Check individual tokens
    searchTokens.forEach(token => {
      if (normName.includes(token)) score += 10;
      // Singular/Plural check (very basic)
      if (token.endsWith('s') && normName.includes(token.slice(0, -1))) score += 8;
      if (!token.endsWith('s') && normName.includes(token + 's')) score += 8;
    });

    if (score > maxScore && score > 0) {
      maxScore = score;
      bestMatch = disease;
    }
  });

  return bestMatch;
};
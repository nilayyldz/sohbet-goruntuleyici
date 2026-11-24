export interface Contact {
  name: string;
  phones: string[];
}

/** Basit vCard ayrıştırıcı: FN ve TEL alanları (katlanmış satırlar dahil) */
export function parseVcf(text: string): Contact[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '');
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  return cards.map((card) => {
    const lines = card.split(/\r?\n/);
    let name = '';
    const phones: string[] = [];
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const key = line.slice(0, idx).toUpperCase();
      const val = line.slice(idx + 1).trim();
      if (key === 'FN' || key.startsWith('FN;')) name = val;
      else if (!name && (key === 'N' || key.startsWith('N;'))) name = val.split(';').filter(Boolean).reverse().join(' ');
      else if (key === 'TEL' || key.startsWith('TEL;') || /^ITEM\d+\.TEL/.test(key)) phones.push(val);
    }
    return { name: name || 'Kişi', phones };
  });
}

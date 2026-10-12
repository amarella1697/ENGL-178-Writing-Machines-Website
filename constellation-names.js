// The class's constellations, used by index.html and constellations.html.
// A name typed close to one of these (different capitals, singular or plural,
// with or without "The", different spacing) counts as that constellation.
export const CONSTELLATIONS = [
  'Baffling Complexities',
  'Being Fooled',
  'Country of Geniuses',
  'Engineering Context',
  'Following Rules',
  'Geometry',
  'Imagining Language',
  'Imitation Game',
  'The Moving Goalpost'
];

// Ways a name might be written: as is, and without a plural ending.
function forms(name) {
  const bare = name.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
  return [bare, bare.replace(/ies$/, 'y'), bare.replace(/es$/, ''), bare.replace(/s$/, '')];
}

// The official name for a typed constellation name, or the name itself if it is a new one.
export function officialName(name) {
  name = String(name || '').trim();
  if (!name) return '';
  const mine = forms(name);
  return CONSTELLATIONS.find(c => forms(c).some(f => mine.includes(f))) || name;
}

export const categoryOf = e => officialName(e.category) || 'Uncategorized';

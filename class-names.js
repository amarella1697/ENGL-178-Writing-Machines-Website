// The people who can make entries, used by index.html and constellations.html.
// Entries are signed with these names. Older entries signed with a full name, or
// with a misspelling listed below, are shown under the matching name here.
export const CLASS_NAMES = [
  'Dr. Edoro',
  'Ahmed',
  'Anushka',
  'Arvind',
  'Aryan',
  'Cengiz',
  'Colin',
  'Colleen',
  'Geonho',
  'Haochun',
  'Justin',
  'Kenzo',
  'Matthew',
  'Nikhil',
  'Praveer',
  'Reyansh',
  'Yug',
  'Zander',
  'Zhiyuan'
];

// Other ways a name has been written, lower-cased.
const ALIASES = {
  'ainehi': 'Dr. Edoro',
  'edoro': 'Dr. Edoro',
  'ainehi edoro': 'Dr. Edoro',
  'dr edoro': 'Dr. Edoro',
  'zhiyan': 'Zhiyuan'
};

// The listed name for a signed name, or the name itself if it isn't one of the class's.
export function className(name) {
  name = String(name || '').trim();
  const key = name.toLowerCase();
  if (!key) return '';
  const first = key.split(/\s+/)[0];
  return CLASS_NAMES.find(n => n.toLowerCase() === key)
    || ALIASES[key]
    || CLASS_NAMES.find(n => n.toLowerCase() === first)
    || ALIASES[first]
    || name;
}

export const entrantOf = e => className(e.entrant);

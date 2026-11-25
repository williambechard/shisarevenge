// Neutral domain names. UI text uses theme names (see design/05-coding-standards.md section 3).

export type CardValue = 1 | 2 | 3 | 4 | 5;

export type Team = 'survivor' | 'infected';

export type SpecialKind = 'bingata-shawl' | 'hot-shikuwasa' | 'shisa-mask';

export type SpecialStatus = 'available' | 'committed' | 'spent' | 'lost';

export type Phase =
  'lobby' | 'announce' | 'pairing' | 'selecting' | 'revealed' | 'resolved' | 'ended';

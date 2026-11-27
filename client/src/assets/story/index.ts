// The story: pictures and text, in reading order (design/12-story.md).
//
// Pictures are read from this folder. Name them with a number first, so they sort in reading order, for
// example 01_intro.png or 05_story.png. Pages without a picture come from the text below.

export type StoryPage = {
  // The picture, when there is one.
  src?: string | undefined;
  title?: string | undefined;
  // Text shown on the page, under the picture or on its own.
  caption?: string | undefined;
  // Several short paragraphs, for example the special card rules.
  body?: readonly string[] | undefined;
};

// Text for a picture, keyed by its filename without the extension. Works with or without the picture.
const CAPTIONS: Readonly<Record<string, string>> = {
  '5_story':
    'When village time is up you are taken to the Duel. Select a card to risk. The card will let you know what it does. Number cards: the higher number wins, and a tie does nothing. The winner can pick an unrevealed card from the loser.',
};

// Text-only pages, placed by their order number.
const TEXT_PAGES: readonly { order: number; page: StoryPage }[] = [
  {
    order: 5.5,
    page: {
      title: 'Special cards',
      body: [
        'Protection Talisman (strength 2). Blocks a freeze: if Shisa\u2019s Army wins the duel, you are not caught. Playing it spends it, win or lose.',
        'Ramen (strength 3). Recovers a Shisa\u2019s Army member: if you win the duel, the Shisa\u2019s Army member you faced rejoins the Survivors. Playing it spends it, win or lose.',
        'Shisa Mask (strength 4). Shisa\u2019s Army only. A card of strength 4 with no bonus. Playing it spends it, win or lose.',
      ],
    },
  },
];

const pictures = import.meta.glob<string>('./*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

// The number at the start of a name, which sets the reading order. Names without one go last.
function orderOf(stem: string): number {
  const value = Number.parseFloat(stem);
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function stemOf(path: string): string {
  return path.slice(2).replace(/\.[^.]+$/, '');
}

const entries: { order: number; page: StoryPage }[] = [];
const withPicture = new Set<string>();
for (const path of Object.keys(pictures)) {
  const stem = stemOf(path);
  withPicture.add(stem);
  entries.push({
    order: orderOf(stem),
    page: { src: pictures[path], caption: CAPTIONS[stem] },
  });
}
// A caption without a picture becomes a text page in the same place.
for (const [stem, caption] of Object.entries(CAPTIONS)) {
  if (!withPicture.has(stem)) entries.push({ order: orderOf(stem), page: { caption } });
}
entries.push(...TEXT_PAGES);

export const STORY_PAGES: readonly StoryPage[] = entries
  .sort((a, b) => a.order - b.order)
  .map((entry) => entry.page);

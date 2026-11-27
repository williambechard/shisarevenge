// Story pictures, shown in filename order. Name them so they sort in reading order, for example
// 01_intro.png, 02_how_to_play.png. Add, remove, or reorder files here; no code change is needed.
const pictures = import.meta.glob<string>('./*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const STORY_PAGES: readonly string[] = Object.keys(pictures)
  .sort()
  .map((path) => pictures[path] ?? '');

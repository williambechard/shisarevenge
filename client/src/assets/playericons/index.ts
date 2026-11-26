// Player icons (128x128 PNG). Index 0 to 7. The server gives each seat a different index in a room.
import icon0 from './100yen_playericon.png';
import icon1 from './10yen_playericon.png';
import icon2 from './flower_playericon.png';
import icon3 from './ramen_playericon.png';
import icon4 from './shisa_playericon.png';
import icon5 from './tacorice_playericon.png';
import icon6 from './temple_playericon.png';
import icon7 from './torigate_playericon.png';

export const PLAYER_ICONS: readonly string[] = [
  icon0,
  icon1,
  icon2,
  icon3,
  icon4,
  icon5,
  icon6,
  icon7,
];

// The picture for an icon index. Out-of-range indexes wrap, so a bad index still shows an icon.
export function playerIconSrc(index: number): string {
  const count = PLAYER_ICONS.length;
  return PLAYER_ICONS[((index % count) + count) % count] ?? '';
}

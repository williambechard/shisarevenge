// Which sound a private notice makes for the player who gets it. Bad news is a low sound, good news a chime.
import type { PrivateNotice } from '@shisa-revenge/shared';
import type { SfxName } from './tracks.js';

export function soundForNotice(notice: PrivateNotice): SfxName | null {
  switch (notice.kind) {
    case 'caught-cold':
    case 'card-lost':
    case 'eliminated':
    case 'accused':
    case 'auto-locked':
      return 'bad';
    case 'accusation-result':
      return notice.correct ? 'success' : 'bad';
    case 'recovered':
    case 'card-gained':
    case 'vended':
      return 'success';
    case 'challenged':
    case 'partnered':
      return null;
  }
}

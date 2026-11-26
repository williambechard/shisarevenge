// Village art (design/10-village.md section 8). Walkway tiles vary so the stone does not repeat.
import walkway1 from './village_walkway_1.png';
import walkway2 from './village_walkway_2.png';
import walkway3 from './village_walkway_3.png';
import vendingMachine from './village_vending_machine.png';
import background from './village_background.jpg';

export const WALKWAY_ART = [walkway1, walkway2, walkway3] as const;
export const VENDING_ART = vendingMachine;
export const VILLAGE_BACKGROUND_ART = background;

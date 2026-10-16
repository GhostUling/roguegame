import { CharacterDef, CharacterId } from '../types';
import { ShipDrawer } from './shipDraw';
import { alphaPrism, drawAlphaPrism } from './alphaPrism';
import { betaPhalanx, drawBetaPhalanx } from './betaPhalanx';
import { gammaViper, drawGammaViper } from './gammaViper';
import { deltaChronos, drawDeltaChronos } from './deltaChronos';
import { epsilonCarrier, drawEpsilonCarrier } from './epsilonCarrier';
import { zetaAurora, drawZetaAurora } from './zetaAurora';
import { etaSiphon, drawEtaSiphon } from './etaSiphon';
import { thetaAegis, drawThetaAegis } from './thetaAegis';
import { iotaFusion, drawIotaFusion } from './iotaFusion';
import { kappaLance, drawKappaLance } from './kappaLance';

export type { ShipDrawer } from './shipDraw';

/** Every playable chassis, in the order the hangar lists them. */
export const CHARACTERS: CharacterDef[] = [
  alphaPrism,
  betaPhalanx,
  gammaViper,
  deltaChronos,
  epsilonCarrier,
  zetaAurora,
  etaSiphon,
  thetaAegis,
  iotaFusion,
  kappaLance,
];

/** How each chassis looks. Kept beside CHARACTERS so a new hull is one file. */
const SHIP_DRAWERS: Record<CharacterId, ShipDrawer> = {
  alpha_prism: drawAlphaPrism,
  beta_phalanx: drawBetaPhalanx,
  gamma_viper: drawGammaViper,
  delta_chronos: drawDeltaChronos,
  epsilon_carrier: drawEpsilonCarrier,
  zeta_aurora: drawZetaAurora,
  eta_siphon: drawEtaSiphon,
  theta_aegis: drawThetaAegis,
  iota_fusion: drawIotaFusion,
  kappa_lance: drawKappaLance,
};

export function getCharacterDef(id: CharacterId): CharacterDef {
  const char = CHARACTERS.find((c) => c.id === id);
  return char || CHARACTERS[0];
}

/**
 * Draws a vessel's geometric silhouette centered on the current transform origin.
 * Shared by the in-game renderer and the hangar preview so both stay in sync.
 * `angle` orients the nose; `time` drives the idle spin animation.
 */
export function drawCharacterShip(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  radius: number,
  angle: number,
  time: number
): void {
  SHIP_DRAWERS[charId](ctx, radius, angle, time);
}

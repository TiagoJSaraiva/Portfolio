import type { Point } from './homeTransition'

export const beltConfig = {
  columns: 6,
  spacing: 112,
  rowHeight: 88,
  iconSize: 26,
  /** Seconds for one tile width. */
  duration: 32,
} as const

export const beltTile = {
  width: beltConfig.columns * beltConfig.spacing,
  height: beltConfig.rowHeight * 2,
} as const

export interface BeltSync {
  /** Viewport position of the sector belt's untranslated tile grid. */
  origin: Point
  /** Document timeline start of the sector belt's running animation, when available. */
  startTime: number | null
}

export function readBelt(sector: HTMLElement): BeltSync {
  const bounds = sector.getBoundingClientRect()
  const belt = sector.querySelector('[data-sector-belt]')
  const startTime = belt?.getAnimations?.()[0]?.startTime
  return {
    // The belt is absolutely positioned inside the padding box, below any border.
    origin: { x: bounds.left + sector.clientLeft, y: bounds.top + sector.clientTop },
    startTime: typeof startTime === 'number' ? startTime : null,
  }
}

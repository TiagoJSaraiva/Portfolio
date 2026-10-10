import type { CategoryId } from '../../data/types'

export const transitionConfig = {
  coverage: 0.7,
  fade: 0.22,
  settle: 0.25,
  reveal: 0.65,
  acceleration: 4500,
  maxSpeed: 8000,
  overshootPerSpeed: 0.014,
} as const

export type TransitionPhase = 'idle' | 'covering' | 'flying' | 'revealing' | 'ready'
export interface Point {
  x: number
  y: number
}
export interface Bounds {
  left: number
  top: number
  width: number
  height: number
}
export interface SelectionGeometry {
  category: CategoryId
  width: number
  height: number
  mobile: boolean
  pivot: Point
  scene: Bounds
  sector: Bounds
  icon: Bounds
}

export function iconTarget(mobile: boolean) {
  const inset = mobile ? 28 : 48
  const size = mobile ? 78 : 104
  return { x: inset + size / 2, y: inset + size / 2, size }
}

export function flight(distance: number, mobile: boolean) {
  const { acceleration, maxSpeed, overshootPerSpeed } = transitionConfig
  const peakSpeed = Math.min(maxSpeed, Math.sqrt(2 * acceleration * distance))
  const accelerationTime = peakSpeed / acceleration
  const accelerationDistance = (acceleration * accelerationTime ** 2) / 2
  const duration =
    distance === 0 ? 0 : accelerationTime + (distance - accelerationDistance) / peakSpeed
  return {
    duration,
    peakSpeed,
    overshoot: Math.min(peakSpeed * overshootPerSpeed, mobile ? 12 : 24),
    // Motion samples this time-distance curve without React updates per frame.
    progress: (fraction: number) => {
      if (distance === 0) return 1
      const time = Math.max(0, Math.min(1, fraction)) * duration
      const travelled =
        time <= accelerationTime
          ? (acceleration * time ** 2) / 2
          : accelerationDistance + peakSpeed * (time - accelerationTime)
      return Math.min(1, travelled / distance)
    },
  }
}

export function coverage(geometry: SelectionGeometry, progress: number) {
  const { width, height, pivot, scene, category, sector, mobile } = geometry
  const p = Math.max(0, Math.min(1, progress))
  if (mobile) {
    const top = sector.top * (1 - p)
    const bottom = sector.top + sector.height + (height - sector.top - sector.height) * p
    return {
      surface: `M0 ${top}H${width}V${bottom}H0Z`,
      border: `M0 ${top}H${width}M0 ${bottom}H${width}`,
    }
  }
  const left = Math.atan2(scene.top + scene.height - pivot.y, scene.left - pivot.x)
  const right = Math.atan2(scene.top + scene.height - pivot.y, scene.left + scene.width - pivot.x)
  const above = -Math.PI / 2
  const aboveAfterTurn = (3 * Math.PI) / 2
  const start =
    category === 'web'
      ? above
      : category === 'games'
        ? left + (above - left) * p
        : right + (above - right) * p
  const end =
    category === 'games'
      ? aboveAfterTurn
      : category === 'web'
        ? right + (aboveAfterTurn - right) * p
        : left + (aboveAfterTurn - left) * p
  // The arc stays outside the viewport; only the rotating straight edges are visible.
  const radius = 2 * Math.hypot(width + Math.abs(pivot.x), height + Math.abs(pivot.y))
  const ray = (angle: number) =>
    `${pivot.x + radius * Math.cos(angle)} ${pivot.y + radius * Math.sin(angle)}`
  const origin = `${pivot.x} ${pivot.y}`
  const surface =
    p === 1
      ? `M0 0H${width}V${height}H0Z`
      : `M${origin}L${ray(start)}A${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${ray(end)}Z`
  const border =
    category === 'web'
      ? `M${origin}L${ray(end)}`
      : category === 'games'
        ? `M${origin}L${ray(start)}`
        : `M${ray(start)}L${origin}L${ray(end)}`
  return { surface, border: p === 1 ? '' : border }
}

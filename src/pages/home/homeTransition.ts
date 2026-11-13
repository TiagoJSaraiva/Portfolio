import type { CategoryId } from '../../data/types'
import type { BeltSync } from './beltConfig'

export const transitionConfig = {
  coverage: 0.7,
  fade: 0.22,
  beltFade: 0.4,
  returnCover: 0.65,
  returnFade: 0.45,
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
  belt: BeltSync
}

export interface ReturnGeometry {
  category: CategoryId
  /** Center and radius of the corner circle when the return starts. */
  center: Point
  radius: number
  width: number
  height: number
}

/** Radius past the farthest viewport corner, leaving no antialiased gap at the edge. */
export function returnRadius({ center, width, height }: ReturnGeometry) {
  const reach = Math.hypot(
    Math.max(center.x, width - center.x),
    Math.max(center.y, height - center.y),
  )
  return reach + 2
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

type Vertex = readonly [number, number]

// Sutherland–Hodgman against the four viewport edges.
export function clipToViewport(points: readonly Vertex[], width: number, height: number) {
  const edges = [
    [0, 0, 1],
    [0, width, -1],
    [1, 0, 1],
    [1, height, -1],
  ] as const
  let output = [...points]
  for (const [axis, limit, side] of edges) {
    const input = output
    output = []
    input.forEach((current, index) => {
      const previous = input[(index + input.length - 1) % input.length]
      const inside = (current[axis] - limit) * side >= 0
      if (inside !== (previous[axis] - limit) * side >= 0) {
        const t = (limit - previous[axis]) / (current[axis] - previous[axis])
        output.push([
          previous[0] + (current[0] - previous[0]) * t,
          previous[1] + (current[1] - previous[1]) * t,
        ])
      }
      if (inside) output.push(current)
    })
  }
  return output
}

function polygonPath(points: readonly Vertex[]) {
  if (points.length < 3) return 'M0 0Z'
  const round = (value: number) => Math.round(value * 100) / 100
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
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
  // Twice the farthest corner keeps every 30° chord of the sampled arc off screen too.
  const radius =
    2 * Math.hypot(Math.max(pivot.x, width - pivot.x), Math.max(pivot.y, height - pivot.y))
  const point = (angle: number): Vertex => [
    pivot.x + radius * Math.cos(angle),
    pivot.y + radius * Math.sin(angle),
  ]
  const ray = (angle: number) => point(angle).join(' ')
  const origin = `${pivot.x} ${pivot.y}`
  const steps = Math.max(1, Math.ceil((end - start) / (Math.PI / 6)))
  const wedge: Vertex[] = [[pivot.x, pivot.y]]
  for (let step = 0; step <= steps; step++)
    wedge.push(point(start + ((end - start) * step) / steps))
  // Clipping to the viewport keeps the clip-path mask of the coverage belt screen-sized;
  // an off-screen arc made Chromium raster and composite a mask of tens of megapixels.
  const surface =
    p === 1 ? `M0 0H${width}V${height}H0Z` : polygonPath(clipToViewport(wedge, width, height))
  const border =
    category === 'web'
      ? `M${origin}L${ray(end)}`
      : category === 'games'
        ? `M${origin}L${ray(start)}`
        : `M${ray(start)}L${origin}L${ray(end)}`
  return { surface, border: p === 1 ? '' : border }
}

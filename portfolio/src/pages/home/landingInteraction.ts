import type { Bounds, Point } from './homeTransition'

export const landingInteractionConfig = {
  desktop: { radius: 160, displacement: 24 },
  mobile: { radius: 120, displacement: 16 },
  dragThreshold: 6,
  ringInset: 12,
  hoverScale: 1.16,
  spring: { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 },
} as const

export function attractionOffset(origin: Point, pointer: Point, mobile: boolean): Point {
  const { radius, displacement } = landingInteractionConfig[mobile ? 'mobile' : 'desktop']
  const dx = pointer.x - origin.x
  const dy = pointer.y - origin.y
  const distance = Math.hypot(dx, dy)
  if (distance === 0 || distance >= radius) return { x: 0, y: 0 }
  const proximity = 1 - distance / radius
  const falloff = proximity * proximity * (3 - 2 * proximity)
  const amount = Math.min(distance * 0.5, displacement) * falloff
  return { x: (dx / distance) * amount, y: (dy / distance) * amount }
}

// Positions are the unscaled circle's top-left, in viewport coordinates.
export function clampBall(position: Point, bounds: Bounds, viewport: Point, scale: number): Point {
  const margin = (size: number) =>
    (size * (scale - 1)) / 2 + landingInteractionConfig.ringInset * scale
  const clamp = (value: number, size: number, available: number) => {
    const inset = margin(size)
    if (available < size + inset * 2) return (available - size) / 2
    return Math.max(inset, Math.min(value, available - size - inset))
  }
  return {
    x: clamp(position.x, bounds.width, viewport.x),
    y: clamp(position.y, bounds.height, viewport.y),
  }
}

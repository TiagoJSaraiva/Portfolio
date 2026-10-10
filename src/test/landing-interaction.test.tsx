import { act, renderHook } from '@testing-library/react'
import { motionValue } from 'motion/react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { CategoryId } from '../data/types'
import { attractionOffset, clampBall } from '../pages/home/landingInteraction'
import { useLandingInteraction } from '../pages/home/useLandingInteraction'
import type { LandingBall } from '../pages/home/useLandingInteraction'

vi.mock('motion/react', async (original) => ({
  ...(await original<typeof import('motion/react')>()),
  animate: vi.fn((value: { set: (target: number) => void }, target: number) => {
    value.set(target)
    return { stop: vi.fn() }
  }),
}))

describe('landing geometry', () => {
  it('attracts toward the pointer with falloff and desktop/mobile limits', () => {
    const origin = { x: 200, y: 200 }
    for (const mobile of [false, true]) {
      const radius = mobile ? 120 : 160
      const limit = mobile ? 16 : 24
      expect(attractionOffset(origin, origin, mobile)).toEqual({ x: 0, y: 0 })
      expect(attractionOffset(origin, { x: 200 + radius, y: 200 }, mobile)).toEqual({ x: 0, y: 0 })
      const nearby = attractionOffset(origin, { x: 240, y: 230 }, mobile)
      expect(nearby.x).toBeGreaterThan(0)
      expect(nearby.y).toBeGreaterThan(0)
      expect(Math.hypot(nearby.x, nearby.y)).toBeLessThanOrEqual(limit)
      expect(attractionOffset(origin, { x: 200 + radius - 1, y: 200 }, mobile).x).toBeLessThan(0.01)
    }
    expect(attractionOffset(origin, { x: 240, y: 200 }, true).x).toBeLessThan(
      attractionOffset(origin, { x: 240, y: 200 }, false).x,
    )
  })

  it('keeps the scaled circle and ring inside every viewport edge', () => {
    const bounds = { left: 100, top: 100, width: 104, height: 104 }
    for (const scale of [1, 1.16]) {
      const inset = (104 * (scale - 1)) / 2 + 12 * scale
      expect(clampBall({ x: -500, y: -500 }, bounds, { x: 360, y: 768 }, scale)).toEqual({
        x: inset,
        y: inset,
      })
      expect(clampBall({ x: 2000, y: 2000 }, bounds, { x: 360, y: 768 }, scale)).toEqual({
        x: 360 - 104 - inset,
        y: 768 - 104 - inset,
      })
      expect(clampBall({ x: 100, y: 200 }, bounds, { x: 360, y: 768 }, scale)).toEqual({
        x: 100,
        y: 200,
      })
    }
  })
})

function pointer(type: string, overrides = {}) {
  document.dispatchEvent(
    Object.assign(new Event(type, { bubbles: true }), {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 180,
      clientY: 150,
      ...overrides,
    }),
  )
}

function fixture() {
  const selected = vi.fn()
  const initialProps: { category: CategoryId | undefined; reduced: boolean } = {
    category: undefined,
    reduced: false,
  }
  const hook = renderHook(
    ({ category, reduced }) => useLandingInteraction(category, reduced, selected),
    { initialProps },
  )
  const createBall = (left: number): LandingBall => {
    const origin = document.createElement('span')
    const sector = document.createElement('button')
    const icon = document.createElement('span')
    const handle = document.createElement('span')
    origin.getBoundingClientRect = () => new DOMRect(left, 100, 104, 104)
    icon.getBoundingClientRect = () => new DOMRect(left, 100, 104, 104)
    handle.setPointerCapture = vi.fn()
    handle.hasPointerCapture = () => true
    handle.releasePointerCapture = vi.fn()
    return { origin, sector, icon, handle, x: motionValue(0), y: motionValue(0) }
  }
  const games = createBall(100)
  const web = createBall(500)
  act(() => {
    hook.result.current.register('games', games)
    hook.result.current.register('web', web)
  })
  const press = (id: CategoryId = 'games') =>
    act(() =>
      hook.result.current.press(id, {
        button: 0,
        isPrimary: true,
        pointerId: 1,
        clientX: 152,
        clientY: 152,
        preventDefault: vi.fn(),
      } as unknown as ReactPointerEvent<HTMLSpanElement>),
    )
  return { ...hook, games, web, selected, press }
}

describe('landing gestures', () => {
  it('freezes every ball, rejects another gesture and selects once on release', () => {
    const f = fixture()
    act(() => pointer('pointermove'))
    expect(f.games.x.get()).toBeGreaterThan(100)
    f.press()
    const frozen = f.web.x.get()
    expect(f.result.current.locked).toBe(true)
    f.press('web')
    act(() => f.result.current.select('web'))
    act(() => pointer('pointermove', { clientX: 580 }))
    expect(f.web.x.get()).toBe(frozen)
    act(() => pointer('pointerup'))
    act(() => pointer('pointerup'))
    expect(f.selected).toHaveBeenCalledExactlyOnceWith('games', f.games.icon, f.games.sector)
  })

  it('uses the drag threshold, cancels with Escape and preserves keyboard selection', () => {
    const f = fixture()
    f.press()
    act(() => pointer('pointermove', { clientX: 155, clientY: 152 }))
    expect(f.result.current.dragging).toBeUndefined()
    expect(f.games.x.get()).toBe(100)
    act(() => pointer('pointermove', { clientX: 300, clientY: 200 }))
    expect(f.result.current.dragging).toBe('games')
    expect(f.games.x.get()).toBe(248)
    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
    expect(f.games.x.get()).toBe(100)
    expect(f.result.current.locked).toBe(true)
    expect(f.selected).not.toHaveBeenCalled()
    act(() => pointer('pointerup'))
    act(() => f.result.current.select('web'))
    expect(f.selected).toHaveBeenCalledExactlyOnceWith('web', f.web.icon, f.web.sector)
  })

  it.each(['pointercancel', 'lostpointercapture', 'blur', 'resize'])(
    'cancels %s without navigating',
    (type) => {
      const f = fixture()
      f.press()
      act(() => pointer('pointermove', { clientX: 300 }))
      act(() => {
        if (type === 'blur' || type === 'resize') window.dispatchEvent(new Event(type))
        else pointer(type)
      })
      expect(f.games.x.get()).toBe(100)
      expect(f.result.current.dragging).toBeUndefined()
      expect(f.result.current.locked).toBe(true)
      act(() => pointer('pointerup'))
      expect(f.selected).not.toHaveBeenCalled()
    },
  )

  it('cancels a viewport change even before the browser delivers its resize event', () => {
    const f = fixture()
    f.press()
    act(() => pointer('pointermove', { clientX: 300 }))
    vi.stubGlobal('innerWidth', window.innerWidth - 100)
    try {
      act(() => pointer('pointerup'))
      expect(f.selected).not.toHaveBeenCalled()
      expect(f.games.x.get()).toBe(100)
      expect(f.result.current.dragging).toBeUndefined()
      expect(f.result.current.locked).toBe(true)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('restores origins and rearms attraction only after returning from a category', () => {
    const f = fixture()
    f.press()
    act(() => pointer('pointermove', { clientX: 300 }))
    act(() => pointer('pointerup'))
    f.rerender({ category: 'games', reduced: false })
    act(() => pointer('pointermove', { clientX: 180 }))
    expect(f.games.x.get()).toBe(248)
    f.rerender({ category: undefined, reduced: false })
    expect(f.games.x.get()).toBe(100)
    expect(f.result.current.locked).toBe(false)
    act(() => pointer('pointermove'))
    expect(f.games.x.get()).toBeGreaterThan(100)
  })

  it('ignores attraction with reduced motion and cancels an active gesture when enabled', () => {
    const f = fixture()
    f.rerender({ category: undefined, reduced: true })
    act(() => pointer('pointermove'))
    expect(f.games.x.get()).toBe(100)
    f.press()
    act(() => pointer('pointermove', { clientX: 300 }))
    expect(f.games.x.get()).toBe(248)
    act(() => pointer('pointerup'))
    expect(f.selected).toHaveBeenCalledOnce()
    f.rerender({ category: 'games', reduced: false })
    f.rerender({ category: undefined, reduced: false })
    f.press()
    act(() => pointer('pointermove', { clientX: 300 }))
    f.rerender({ category: undefined, reduced: true })
    expect(f.result.current.dragging).toBeUndefined()
    expect(f.games.x.get()).toBe(100)
  })
})

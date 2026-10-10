import { animate } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { CategoryId } from '../../data/types'
import type { Bounds, Point } from './homeTransition'
import {
  attractionOffset,
  clampBall,
  landingInteractionConfig as config,
} from './landingInteraction'

export interface LandingBall {
  origin: HTMLSpanElement
  icon: HTMLSpanElement
  handle: HTMLSpanElement
  sector: HTMLButtonElement
  x: MotionValue<number>
  y: MotionValue<number>
}

interface RegisteredBall extends LandingBall {
  bounds: Bounds
  controls: Array<{ stop: () => void }>
  target: Point | null
}

interface Gesture {
  id: CategoryId
  pointerId: number
  start: Point
  position: Point
  viewport: Point
  dragged: boolean
}

export interface LandingInteraction {
  locked: boolean
  dragging?: CategoryId
  register: (id: CategoryId, ball: LandingBall) => () => void
  press: (id: CategoryId, event: ReactPointerEvent<HTMLSpanElement>) => void
  select: (id: CategoryId) => void
  freeze: () => void
}

export function useLandingInteraction(
  category: CategoryId | undefined,
  reducedMotion: boolean,
  onSelect: (id: CategoryId, icon: HTMLSpanElement, sector: HTMLButtonElement) => void,
): LandingInteraction {
  const balls = useRef(new Map<CategoryId, RegisteredBall>())
  const gesture = useRef<Gesture | null>(null)
  const blocked = useRef(false)
  const previousCategory = useRef(category)
  const settings = useRef({ category, reducedMotion, onSelect })
  const [lock, setLock] = useState({ category, value: false })
  const [dragState, setDragState] = useState<{
    category?: CategoryId
    reducedMotion: boolean
    id?: CategoryId
  }>({ category, reducedMotion })
  if (lock.category !== category) setLock({ category, value: !!category })
  if (dragState.category !== category || dragState.reducedMotion !== reducedMotion)
    setDragState({
      category,
      reducedMotion,
      id: dragState.category === category && !reducedMotion ? dragState.id : undefined,
    })
  const setDragging = useCallback((id?: CategoryId) => {
    setDragState({
      category: settings.current.category,
      reducedMotion: settings.current.reducedMotion,
      id,
    })
  }, [])

  useLayoutEffect(() => {
    settings.current = { category, reducedMotion, onSelect }
  })

  const stop = useCallback((ball: RegisteredBall) => {
    ball.controls.forEach((control) => control.stop())
    ball.controls = []
    ball.target = null
  }, [])

  const measure = useCallback(() => {
    if (settings.current.category) return
    balls.current.forEach((ball, id) => {
      const rect = ball.origin.getBoundingClientRect()
      const previous = ball.bounds
      if (
        previous.left === rect.left &&
        previous.top === rect.top &&
        previous.width === rect.width &&
        previous.height === rect.height
      )
        return
      ball.bounds = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
      if (gesture.current?.id !== id) {
        stop(ball)
        ball.x.set(rect.left)
        ball.y.set(rect.top)
      }
    })
  }, [stop])

  const restore = useCallback(() => {
    balls.current.forEach((ball) => {
      stop(ball)
      ball.icon.style.removeProperty('transform')
      ball.icon.style.removeProperty('transition')
      ball.x.set(ball.bounds.left)
      ball.y.set(ball.bounds.top)
    })
  }, [stop])

  const releaseCapture = useCallback(() => {
    const current = gesture.current
    gesture.current = null
    if (!current) return
    const handle = balls.current.get(current.id)?.handle
    if (handle?.hasPointerCapture(current.pointerId))
      handle.releasePointerCapture(current.pointerId)
  }, [])

  const release = useCallback(() => {
    releaseCapture()
    setDragging(undefined)
  }, [releaseCapture, setDragging])

  const cancel = useCallback(() => {
    if (!gesture.current) return
    release()
    restore()
  }, [release, restore])

  const freeze = useCallback(() => {
    blocked.current = true
    setLock({ category: settings.current.category, value: true })
    balls.current.forEach((ball) => {
      stop(ball)
      // Freeze the actual hover scale as well as translation before measuring selection.
      const transform = getComputedStyle(ball.icon).transform
      ball.icon.style.transition = 'none'
      ball.icon.style.transform = transform
    })
  }, [stop])

  const register = useCallback(
    (id: CategoryId, ball: LandingBall) => {
      const rect = ball.origin.getBoundingClientRect()
      const entry: RegisteredBall = {
        ...ball,
        bounds: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        controls: [],
        target: null,
      }
      balls.current.set(id, entry)
      // Direct subscription also makes a pointerup before the next frame measure the latest position.
      const renderPosition = () => {
        ball.handle.style.transform = `translate3d(${ball.x.get()}px, ${ball.y.get()}px, 0)`
      }
      const unsubscribeX = ball.x.on('change', renderPosition)
      const unsubscribeY = ball.y.on('change', renderPosition)
      ball.x.set(rect.left)
      ball.y.set(rect.top)
      renderPosition()
      const observer = new ResizeObserver(measure)
      observer.observe(ball.sector)
      if (ball.origin.parentElement) observer.observe(ball.origin.parentElement)
      return () => {
        observer.disconnect()
        unsubscribeX()
        unsubscribeY()
        if (gesture.current?.id === id) releaseCapture()
        stop(entry)
        balls.current.delete(id)
      }
    },
    [measure, releaseCapture, stop],
  )

  const select = useCallback(
    (id: CategoryId) => {
      if (gesture.current || settings.current.category) return
      const ball = balls.current.get(id)
      if (!ball) return
      freeze()
      settings.current.onSelect(id, ball.icon, ball.sector)
    },
    [freeze],
  )

  const press = useCallback(
    (id: CategoryId, event: ReactPointerEvent<HTMLSpanElement>) => {
      if (event.button !== 0 || !event.isPrimary || gesture.current || settings.current.category)
        return
      const ball = balls.current.get(id)
      if (!ball) return
      // Touch uses touch-action; mouse must not override the sector's programmatic focus.
      if (event.pointerType !== 'touch') event.preventDefault()
      freeze()
      ball.sector.focus({ preventScroll: true })
      gesture.current = {
        id,
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        position: { x: ball.x.get(), y: ball.y.get() },
        viewport: { x: window.innerWidth, y: window.innerHeight },
        dragged: false,
      }
      ball.handle.setPointerCapture(event.pointerId)
    },
    [freeze],
  )

  useLayoutEffect(() => {
    const registeredBalls = balls.current
    const moveTo = (ball: RegisteredBall, target: Point) => {
      if (ball.target?.x === target.x && ball.target.y === target.y) return
      stop(ball)
      ball.target = target
      ball.controls = [
        animate(ball.x, target.x, config.spring),
        animate(ball.y, target.y, config.spring),
      ]
    }
    const move = (event: PointerEvent) => {
      const current = gesture.current
      if (current) {
        if (event.pointerId !== current.pointerId) return
        const ball = balls.current.get(current.id)
        if (!ball) return
        const dx = event.clientX - current.start.x
        const dy = event.clientY - current.start.y
        if (!current.dragged && Math.hypot(dx, dy) < config.dragThreshold) return
        if (!current.dragged) {
          current.dragged = true
          setDragging(current.id)
        }
        const scale = ball.icon.getBoundingClientRect().width / ball.bounds.width
        const next = clampBall(
          { x: current.position.x + dx, y: current.position.y + dy },
          ball.bounds,
          { x: window.innerWidth, y: window.innerHeight },
          scale,
        )
        ball.x.set(next.x)
        ball.y.set(next.y)
        return
      }
      if (
        blocked.current ||
        settings.current.category ||
        settings.current.reducedMotion ||
        event.pointerType !== 'mouse'
      )
        return
      balls.current.forEach((ball) => {
        const { bounds } = ball
        const offset = ball.sector.matches(':focus-visible')
          ? { x: 0, y: 0 }
          : attractionOffset(
              { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
              { x: event.clientX, y: event.clientY },
              window.innerWidth < 900,
            )
        // Offscreen mobile anchors must remain offscreen until the page is scrolled.
        const target = { x: bounds.left + offset.x, y: bounds.top + offset.y }
        const fullyVisible = bounds.top >= 0 && bounds.top + bounds.height <= window.innerHeight
        moveTo(
          ball,
          fullyVisible
            ? clampBall(
                target,
                bounds,
                { x: window.innerWidth, y: window.innerHeight },
                config.hoverScale,
              )
            : target,
        )
      })
    }
    const up = (event: PointerEvent) => {
      const current = gesture.current
      if (!current || current.pointerId !== event.pointerId) return
      // Resize events can be delivered after pointerup in the same browser frame.
      if (current.viewport.x !== window.innerWidth || current.viewport.y !== window.innerHeight) {
        cancel()
        measure()
        return
      }
      const id = current.id
      release()
      select(id)
    }
    const interrupted = (event: PointerEvent) => {
      if (event.pointerId === gesture.current?.pointerId) cancel()
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && gesture.current) {
        event.preventDefault()
        cancel()
      }
    }
    const leave = (event: PointerEvent) => {
      if (
        event.relatedTarget ||
        gesture.current ||
        blocked.current ||
        settings.current.category ||
        settings.current.reducedMotion
      )
        return
      balls.current.forEach((ball) => moveTo(ball, { x: ball.bounds.left, y: ball.bounds.top }))
    }
    const focus = () => {
      if (blocked.current || settings.current.category) return
      balls.current.forEach((ball) => {
        if (ball.sector.matches(':focus-visible')) {
          if (settings.current.reducedMotion) {
            stop(ball)
            ball.x.set(ball.bounds.left)
            ball.y.set(ball.bounds.top)
          } else moveTo(ball, { x: ball.bounds.left, y: ball.bounds.top })
        }
      })
    }
    const resize = () => {
      cancel()
      restore()
      measure()
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.addEventListener('pointercancel', interrupted)
    document.addEventListener('lostpointercapture', interrupted)
    document.addEventListener('pointerout', leave)
    document.addEventListener('keydown', key)
    document.addEventListener('focusin', focus)
    window.addEventListener('blur', cancel)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', measure)
    let disposed = false
    void document.fonts?.ready.then(() => {
      if (!disposed) measure()
    })
    return () => {
      disposed = true
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.removeEventListener('pointercancel', interrupted)
      document.removeEventListener('lostpointercapture', interrupted)
      document.removeEventListener('pointerout', leave)
      document.removeEventListener('keydown', key)
      document.removeEventListener('focusin', focus)
      window.removeEventListener('blur', cancel)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', measure)
      registeredBalls.forEach(stop)
    }
  }, [cancel, measure, release, restore, select, setDragging, stop])

  useLayoutEffect(() => {
    if (category) {
      releaseCapture()
      blocked.current = true
      balls.current.forEach(stop)
    } else if (previousCategory.current) {
      releaseCapture()
      restore()
      measure()
      blocked.current = false
    }
    if (reducedMotion && !category) {
      releaseCapture()
      restore()
      measure()
    }
    previousCategory.current = category
  }, [category, reducedMotion, measure, releaseCapture, restore, stop])

  return { locked: lock.value, dragging: dragState.id, register, press, select, freeze }
}

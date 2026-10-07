import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLocale } from '../../app/locale'
import { ProjectImage } from '../../components/ProjectImage'
import type { Project } from '../../data/types'
import styles from './ProjectCarousel.module.css'

export function ProjectCarousel({
  projects,
  panelRef,
}: {
  projects: Project[]
  panelRef: RefObject<HTMLDivElement | null>
}) {
  const { locale, t } = useLocale()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const hovering = useRef(false)
  const focused = useRef(false)
  const dragStart = useRef<number | undefined>(undefined)
  const dragged = useRef(false)
  const autoScroll = useMemo(
    () =>
      AutoScroll({
        speed: 0.65,
        startDelay: 900,
        playOnInit: false,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    [],
  )
  const [carouselRef, api] = useEmblaCarousel(
    { loop: projects.length > 1, dragFree: true, align: 'start', watchFocus: true },
    [autoScroll],
  )
  const slides = projects.length > 1 ? [projects, projects, projects].flat() : projects

  useEffect(() => {
    if (!api) return
    const panel = panelRef.current
    const sync = () =>
      setInteracting(hovering.current || focused.current || dragStart.current !== undefined)
    const enter = () => {
      hovering.current = true
      sync()
    }
    const leave = () => {
      hovering.current = false
      sync()
    }
    const isControl = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      !!target.closest('a, button, input, select, textarea, [contenteditable="true"]') &&
      !!panel?.contains(target)
    const focusIn = (event: FocusEvent) => {
      focused.current = isControl(event.target)
      sync()
    }
    const focusOut = (event: FocusEvent) => {
      focused.current = isControl(event.relatedTarget)
      sync()
    }
    // Drag can end outside the viewport; retain the pause until the pointer is released.
    const pointerMove = (event: PointerEvent) => {
      if (dragStart.current !== undefined && Math.abs(event.clientX - dragStart.current) > 7)
        dragged.current = true
    }
    const pointerUp = () => {
      dragStart.current = undefined
      sync()
    }
    const pointerCancel = () => {
      dragged.current = true
      pointerUp()
    }
    panel?.addEventListener('mouseenter', enter)
    panel?.addEventListener('mouseleave', leave)
    panel?.addEventListener('focusin', focusIn)
    panel?.addEventListener('focusout', focusOut)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerCancel)
    return () => {
      panel?.removeEventListener('mouseenter', enter)
      panel?.removeEventListener('mouseleave', leave)
      panel?.removeEventListener('focusin', focusIn)
      panel?.removeEventListener('focusout', focusOut)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerCancel)
    }
  }, [api, panelRef])

  useEffect(() => {
    if (!api) return
    if (paused || interacting || reducedMotion || projects.length < 2) autoScroll.stop()
    else autoScroll.play()
  }, [api, autoScroll, paused, interacting, reducedMotion, projects.length])

  if (!projects.length) return null
  return (
    <div className={styles.carousel}>
      <div
        className={styles.viewport}
        ref={carouselRef}
        data-carousel-viewport
        onPointerDown={(event) => {
          dragStart.current = event.clientX
          dragged.current = false
          setInteracting(true)
        }}
        onPointerMove={(event) => {
          if (dragStart.current !== undefined && Math.abs(event.clientX - dragStart.current) > 7)
            dragged.current = true
        }}
        onPointerUp={() => {
          dragStart.current = undefined
          setInteracting(hovering.current || focused.current)
        }}
        onPointerCancel={() => {
          dragStart.current = undefined
          dragged.current = true
          setInteracting(hovering.current || focused.current)
        }}
      >
        <div className={styles.track} data-carousel-track>
          {slides.map((project, index) => (
            <div
              className={styles.slide}
              key={`${project.id}-${index}`}
              aria-hidden={index >= projects.length || undefined}
            >
              <Link
                to={`/${project.category}/${project.id}`}
                tabIndex={index < projects.length ? 0 : -1}
                aria-label={project.title[locale]}
                onKeyDown={(event) => {
                  // Embla suppresses the next click after dragging, including synthetic keyboard clicks.
                  if (
                    event.key === 'Enter' &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey &&
                    !event.shiftKey
                  ) {
                    event.preventDefault()
                    dragged.current = false
                    navigate(`/${project.category}/${project.id}`)
                  }
                }}
                onClick={(event) => {
                  if (dragged.current && event.detail > 0) {
                    event.preventDefault()
                    dragged.current = false
                  }
                }}
              >
                <ProjectImage project={project} className={styles.image} />
                <span>{project.title[locale]}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <span>
          {t('drag')}
          <span className={styles.line} />
        </span>
        <div>
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            aria-label={t('previous')}
            disabled={projects.length < 2}
          >
            <ArrowLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            aria-label={t('next')}
            disabled={projects.length < 2}
          >
            <ArrowRight size={15} />
          </button>
          {!reducedMotion && projects.length > 1 && (
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={t(paused ? 'play' : 'pause')}
              aria-pressed={paused}
            >
              {paused ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

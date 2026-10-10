import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLocale } from '../../app/locale'
import { useReducedMotionPreference } from '../../app/useReducedMotionPreference'
import { ProjectImage } from '../../components/ProjectImage'
import { GithubIcon } from '../../components/BrandIcons'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import type { Project } from '../../data/types'
import styles from './ProjectCarousel.module.css'

export function ProjectCarousel({
  projects,
  panelRef,
  presentation = 'journey',
  autoStart = true,
}: {
  projects: Project[]
  panelRef: RefObject<HTMLDivElement | null>
  presentation?: 'journey' | 'trail'
  autoStart?: boolean
}) {
  const { locale, t } = useLocale()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotionPreference()
  const [paused, setPaused] = useState(false)
  const [interacting, setInteracting] = useState(false)
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
    {
      loop: projects.length > 1,
      dragFree: true,
      align: 'start',
      watchFocus: true,
      duration: reducedMotion ? 0 : 25,
    },
    [autoScroll],
  )
  const slides = projects.length > 1 ? [projects, projects, projects].flat() : projects

  useEffect(() => {
    if (!api) return
    const panel = panelRef.current
    const sync = () => setInteracting(focused.current || dragStart.current !== undefined)
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
    panel?.addEventListener('focusin', focusIn)
    panel?.addEventListener('focusout', focusOut)
    window.addEventListener('pointermove', pointerMove)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointercancel', pointerCancel)
    focused.current = isControl(document.activeElement)
    sync()
    return () => {
      panel?.removeEventListener('focusin', focusIn)
      panel?.removeEventListener('focusout', focusOut)
      window.removeEventListener('pointermove', pointerMove)
      window.removeEventListener('pointerup', pointerUp)
      window.removeEventListener('pointercancel', pointerCancel)
    }
  }, [api, panelRef])

  useEffect(() => {
    if (!api) return
    const sync = () => {
      if (!autoStart || paused || interacting || reducedMotion || projects.length < 2)
        autoScroll.stop()
      else autoScroll.play(presentation === 'trail' ? 0 : 900)
    }
    sync()
    api.on('reInit', sync)
    return () => {
      api.off('reInit', sync)
    }
  }, [
    api,
    autoScroll,
    paused,
    interacting,
    reducedMotion,
    projects.length,
    autoStart,
    presentation,
  ])

  if (!projects.length)
    return presentation === 'trail' ? (
      <p className={styles.empty}>
        <LocalizedText value={messages.empty} variant="body" />
      </p>
    ) : null
  return (
    <div className={styles.carousel} data-presentation={presentation}>
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
          setInteracting(focused.current)
        }}
        onPointerCancel={() => {
          dragStart.current = undefined
          dragged.current = true
          setInteracting(focused.current)
        }}
      >
        <div className={styles.track} data-carousel-track>
          {slides.map((project, index) => (
            <div
              className={styles.slide}
              key={`${project.id}-${index}`}
              aria-hidden={index >= projects.length || undefined}
            >
              {presentation === 'trail' ? (
                <article className={styles.projectCard} data-project-id={project.id}>
                  <ProjectImage project={project} className={styles.image} />
                  <div className={styles.cardContent}>
                    {project.demo && (
                      <LocalizedText className={styles.demo} value={messages.demo} />
                    )}
                    <h2>
                      <LocalizedText value={project.title} />
                    </h2>
                    {(project.projectUrl || project.githubUrl) && (
                      <div className={styles.actions}>
                        {[
                          {
                            url: project.projectUrl,
                            label: messages.visit,
                            icon: <ArrowRight size={14} />,
                          },
                          {
                            url: project.githubUrl,
                            label: messages.github,
                            icon: <GithubIcon size={14} />,
                          },
                        ].map(
                          ({ url, label, icon }, actionIndex) =>
                            url && (
                              <a
                                key={actionIndex}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={index < projects.length ? 0 : -1}
                                aria-label={`${label[locale]} — ${project.title[locale]}`}
                                onClick={(event) => {
                                  if (dragged.current && event.detail > 0) {
                                    event.preventDefault()
                                    dragged.current = false
                                  }
                                }}
                                onKeyDown={(event) => {
                                  // Bypass Embla's post-drag click suppression for keyboard activation.
                                  if (
                                    event.key === 'Enter' &&
                                    !event.ctrlKey &&
                                    !event.metaKey &&
                                    !event.altKey &&
                                    !event.shiftKey
                                  ) {
                                    event.preventDefault()
                                    dragged.current = false
                                    window.open(url, '_blank', 'noopener,noreferrer')
                                  }
                                }}
                              >
                                {icon}
                                <LocalizedText value={label} />
                              </a>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ) : (
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
                  <LocalizedText value={project.title} className={styles.caption} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <span>
          <LocalizedText value={messages.drag} />
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
              onClick={() => {
                if (paused) {
                  focused.current = false
                  setInteracting(dragStart.current !== undefined)
                }
                setPaused(!paused)
              }}
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

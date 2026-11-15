import { Header } from '../../components/Header'
import { motion } from 'motion/react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { useLocale } from '../../app/locale'
import { useReducedMotionPreference } from '../../app/useReducedMotionPreference'
import { CategoryIcon } from '../../components/CategoryIcon'
import { LocalizedText } from '../../components/LocalizedText'
import { messages } from '../../data/messages'
import { categories, getCategory, getProjects, profile } from '../../data/portfolio'
import type { CategoryId } from '../../data/types'
import { ProjectCarousel } from '../../features/journey/ProjectCarousel'
import { preloadProjectImages } from '../../features/projects/preloadProjectImages'
import { HomeSector } from './HomeSector'
import { CategoryTransition } from './CategoryTransition'
import { transitionConfig } from './homeTransition'
import { readBelt } from './beltConfig'
import { useLandingInteraction } from './useLandingInteraction'
import { landingInteractionConfig } from './landingInteraction'
import { ReturnTransition } from './ReturnTransition'
import type { Point, ReturnGeometry, SelectionGeometry, TransitionPhase } from './homeTransition'
import styles from './HomePage.module.css'

export function HomePage({ category }: { category?: CategoryId }) {
  const navigate = useNavigate()
  const { locale, t, finishLocaleTransition } = useLocale()
  const reducedMotion = useReducedMotionPreference()
  const sceneRef = useRef<HTMLElement>(null)
  const trailRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const lastSelection = useRef<{ category: CategoryId; scroll: number } | null>(null)
  const selecting = useRef(false)
  const previousCategory = useRef(category)
  const returningHome = useRef(false)
  const backTouch = useRef<{ pointerId: number; start: Point; moved: boolean } | null>(null)
  const [geometry, setGeometry] = useState<SelectionGeometry | null>(null)
  const [animationPhase, setAnimationPhase] = useState<TransitionPhase>('idle')
  const [renderedCategory, setRenderedCategory] = useState(category)
  const [ballLayer, setBallLayer] = useState<HTMLDivElement | null>(null)
  const cornerRef = useRef<HTMLButtonElement>(null)
  const [returning, setReturning] = useState<ReturnGeometry | null>(null)
  const [returnCovered, setReturnCovered] = useState(false)
  // Router navigation may commit after the click's local state update.
  if (renderedCategory !== category) {
    setRenderedCategory(category)
    if (geometry && geometry.category !== category) setGeometry(null)
    // History navigation during the expansion replaces the return effect.
    if (returning && !returnCovered) setReturning(null)
  }
  if (geometry && reducedMotion) setGeometry(null)
  const active = geometry?.category === category ? geometry : null
  const phase = active ? animationPhase : category ? 'ready' : 'idle'
  const selectedCategory = getCategory(category)
  const showLanding = phase === 'idle' || phase === 'covering'
  const showTrail = phase === 'revealing' || phase === 'ready'
  const onPhase = useCallback((next: TransitionPhase) => setAnimationPhase(next), [])
  const finish = useCallback(() => {
    setGeometry(null)
    setAnimationPhase('ready')
    selecting.current = false
  }, [])

  useLayoutEffect(() => {
    if (category) returningHome.current = false
    backTouch.current = null
    if (!category) selecting.current = false
    if (!category && previousCategory.current) {
      const saved = lastSelection.current
      window.scrollTo({ top: saved?.scroll ?? 0, behavior: 'instant' })
      if (saved)
        sceneRef.current
          ?.querySelector<HTMLButtonElement>(`[data-category="${saved.category}"]`)
          ?.focus({ preventScroll: true })
    }
    previousCategory.current = category
  }, [category])

  useLayoutEffect(() => {
    if (category && phase === 'ready') headingRef.current?.focus({ preventScroll: true })
  }, [category, phase])

  useLayoutEffect(() => {
    if (!category) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [category])

  useLayoutEffect(() => {
    if (!active) return
    const resize = () => finish()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [active, reducedMotion, finish])

  const coverReturn = useCallback(() => {
    setReturnCovered(true)
    navigate('/')
  }, [navigate])
  const finishReturn = useCallback(() => setReturning(null), [])

  // Resizing or enabling reduced motion completes the return immediately.
  const isReturning = returning !== null
  useLayoutEffect(() => {
    if (!isReturning) return
    const complete = () => {
      if (!returnCovered) navigate('/')
      setReturning(null)
    }
    if (reducedMotion) return complete()
    window.addEventListener('resize', complete)
    return () => window.removeEventListener('resize', complete)
  }, [isReturning, returnCovered, reducedMotion, navigate])

  const interaction = useLandingInteraction(category, reducedMotion, select)

  function select(id: CategoryId, icon: HTMLSpanElement, sector: HTMLButtonElement) {
    if (selecting.current || category) return
    selecting.current = true
    preloadProjectImages(getProjects(id))
    finishLocaleTransition()
    lastSelection.current = { category: id, scroll: window.scrollY }
    if (!reducedMotion && sceneRef.current) {
      const scene = sceneRef.current.getBoundingClientRect()
      setGeometry({
        category: id,
        width: window.innerWidth,
        height: window.innerHeight,
        mobile: window.innerWidth < 900,
        pivot: { x: scene.left + scene.width / 2, y: scene.top + scene.height / 3 },
        scene: { left: scene.left, top: scene.top, width: scene.width, height: scene.height },
        icon: icon.getBoundingClientRect(),
        sector: sector.getBoundingClientRect(),
        belt: readBelt(sector),
      })
      setAnimationPhase('covering')
    } else selecting.current = false
    navigate(`/${id}`)
  }

  function returnHome() {
    if (returningHome.current) return
    returningHome.current = true
    const corner = cornerRef.current
    if (reducedMotion || !corner || !category) {
      navigate('/')
      return
    }
    const bounds = corner.getBoundingClientRect()
    setReturning({
      category,
      center: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
      radius: bounds.width / 2,
      width: window.innerWidth,
      height: window.innerHeight,
    })
    setReturnCovered(false)
  }

  return (
    <div
      className={styles.page}
      data-transition-phase={phase}
      data-attraction-enabled={!category && !reducedMotion && !interaction.locked}
      style={{ '--selection-fade': `${transitionConfig.fade}s` } as CSSProperties}
    >
      <Header />
      <main
        id={!category ? 'main-content' : undefined}
        ref={sceneRef}
        className={styles.composition}
        hidden={!showLanding}
        inert={!!category}
        aria-hidden={category ? true : undefined}
      >
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.sectors}>
          {categories.map((category, index) => (
            <HomeSector
              key={category.id}
              category={category}
              index={index}
              selected={active?.category === category.id}
              layer={ballLayer}
              interaction={interaction}
            />
          ))}
        </div>
        <div
          className={styles.ballLayer}
          ref={setBallLayer}
          data-covering={phase === 'covering' || undefined}
        />
        <div className={styles.hub} data-fading={phase === 'covering' || undefined}>
          <LocalizedText className={`eyebrow ${styles.hello}`} value={messages.hello} />
          <h1 tabIndex={-1} data-page-heading aria-label={profile.name}>
            {profile.name.split(' ').map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </h1>
          <p className={styles.role}>
            <LocalizedText value={profile.role} variant="body" />
          </p>
          <span className={styles.divider} />
          <p className={styles.invitation}>
            <LocalizedText value={profile.invitation} variant="body" />
          </p>
        </div>
      </main>
      {category && selectedCategory && showTrail && (
        <main
          id="main-content"
          className={styles.categoryStage}
          data-category={category}
          aria-busy={phase !== 'ready'}
        >
          <h1
            className={styles.categoryTitle}
            tabIndex={-1}
            ref={headingRef}
            data-page-heading
            aria-label={selectedCategory.label[locale]}
          >
            <LocalizedText
              value={selectedCategory.label}
              reveal={phase === 'revealing' && !reducedMotion}
            />
          </h1>
          <motion.div
            className={styles.trail}
            ref={trailRef}
            key={`${category}-${phase === 'revealing' ? 'entering' : 'ready'}`}
            inert={phase !== 'ready'}
            initial={phase === 'revealing' && !reducedMotion ? { y: window.innerHeight } : false}
            animate={{ y: 0 }}
            transition={{ duration: transitionConfig.reveal, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => {
              if (phase === 'revealing') finish()
            }}
          >
            <ProjectCarousel
              projects={getProjects(category)}
              panelRef={trailRef}
              presentation="trail"
              autoStart={phase === 'ready'}
            />
          </motion.div>
        </main>
      )}
      {active && <CategoryTransition geometry={active} onPhase={onPhase} />}
      {returning && (
        <ReturnTransition
          geometry={returning}
          covered={returnCovered}
          onCovered={coverReturn}
          onDone={finishReturn}
        />
      )}
      {category && phase === 'ready' && (
        <button
          type="button"
          className={styles.cornerIcon}
          ref={cornerRef}
          data-category={category}
          aria-label={t('backHome')}
          onPointerDown={(event) => {
            backTouch.current = null
            if (event.pointerType === 'touch' && event.isPrimary)
              backTouch.current = {
                pointerId: event.pointerId,
                start: { x: event.clientX, y: event.clientY },
                moved: false,
              }
          }}
          onPointerMove={(event) => {
            const touch = backTouch.current
            if (
              touch?.pointerId === event.pointerId &&
              Math.hypot(event.clientX - touch.start.x, event.clientY - touch.start.y) >=
                landingInteractionConfig.dragThreshold
            )
              touch.moved = true
          }}
          onPointerCancel={() => {
            backTouch.current = null
          }}
          onPointerUp={(event) => {
            const touch = backTouch.current
            if (!touch || touch.pointerId !== event.pointerId || touch.moved) return
            const bounds = event.currentTarget.getBoundingClientRect()
            if (
              event.clientX >= bounds.left &&
              event.clientX <= bounds.right &&
              event.clientY >= bounds.top &&
              event.clientY <= bounds.bottom
            )
              returnHome()
          }}
          onClick={(event) => {
            if (event.detail === 0 || !backTouch.current?.moved) returnHome()
          }}
        >
          <CategoryIcon category={category} size={42} />
        </button>
      )}
    </div>
  )
}

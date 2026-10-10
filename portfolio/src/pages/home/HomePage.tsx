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
import { HomeSector } from './HomeSector'
import { CategoryTransition } from './CategoryTransition'
import { transitionConfig } from './homeTransition'
import type { SelectionGeometry, TransitionPhase } from './homeTransition'
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
  const [geometry, setGeometry] = useState<SelectionGeometry | null>(null)
  const [animationPhase, setAnimationPhase] = useState<TransitionPhase>('idle')
  const [renderedCategory, setRenderedCategory] = useState(category)
  // Router navigation may commit after the click's local state update.
  if (renderedCategory !== category) {
    setRenderedCategory(category)
    if (geometry && geometry.category !== category) setGeometry(null)
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

  const select = (id: CategoryId, icon: HTMLSpanElement, sector: HTMLButtonElement) => {
    if (selecting.current || category) return
    selecting.current = true
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
      })
      setAnimationPhase('covering')
    } else selecting.current = false
    navigate(`/${id}`)
  }

  return (
    <div
      className={styles.page}
      data-transition-phase={phase}
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
        <svg
          className={styles.boundaries}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M50 0V33.333333L0 100M50 33.333333 100 100"
            fill="none"
            stroke="#ffffff0c"
            strokeWidth=".07"
          />
        </svg>
        <div className={styles.sectors}>
          {categories.map((category, index) => (
            <HomeSector
              key={category.id}
              category={category}
              index={index}
              selected={active?.category === category.id}
              onSelect={select}
            />
          ))}
        </div>
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
            <p className={styles.demoNote}>
              <LocalizedText value={messages.demoNote} variant="body" />
            </p>
          </motion.div>
        </main>
      )}
      {active && <CategoryTransition geometry={active} onPhase={onPhase} />}
      {category && phase === 'ready' && (
        <button
          type="button"
          className={styles.cornerIcon}
          data-category={category}
          aria-label={t('backHome')}
          onClick={() => navigate('/')}
        >
          <span className={styles.iconRing} aria-hidden="true" />
          <CategoryIcon category={category} size={42} />
        </button>
      )}
    </div>
  )
}

import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { CategoryIcon } from '../../components/CategoryIcon'
import { coverage, flight, iconTarget, transitionConfig } from './homeTransition'
import type { SelectionGeometry, TransitionPhase } from './homeTransition'
import styles from './HomePage.module.css'

export function CategoryTransition({
  geometry,
  onPhase,
}: {
  geometry: SelectionGeometry
  onPhase: (phase: TransitionPhase) => void
}) {
  const { width, height, icon, mobile, category } = geometry
  const target = iconTarget(mobile)
  const from = { x: icon.left + icon.width / 2, y: icon.top + icon.height / 2 }
  const distance = Math.hypot(target.x - from.x, target.y - from.y)
  const trajectory = useMemo(() => flight(distance, mobile), [distance, mobile])
  const progress = useMotionValue(0)
  const travel = useMotionValue(0)
  const scale = useMotionValue(icon.width / target.size)
  const surface = useTransform(progress, (value) => coverage(geometry, value).surface)
  const border = useTransform(progress, (value) => coverage(geometry, value).border)
  const x = useTransform(travel, (value) => from.x + (target.x - from.x) * value - target.size / 2)
  const y = useTransform(travel, (value) => from.y + (target.y - from.y) * value - target.size / 2)

  useEffect(() => {
    let cancelled = false
    const controls: Array<{ stop: () => void }> = []
    async function run() {
      controls.push(animate(scale, 1, { duration: transitionConfig.coverage }))
      const cover = animate(progress, 1, { duration: transitionConfig.coverage, ease: 'easeInOut' })
      controls.push(cover)
      await cover
      if (cancelled) return
      onPhase('flying')
      const fly = animate(travel, 1, { duration: trajectory.duration, ease: trajectory.progress })
      controls.push(fly)
      await fly
      if (cancelled) return
      if (distance > 0) {
        const settle = animate(travel, [1, 1 + trajectory.overshoot / distance, 1], {
          duration: transitionConfig.settle,
          times: [0, 0.4, 1],
          ease: ['easeOut', 'easeInOut'],
        })
        controls.push(settle)
        await settle
      }
      if (!cancelled) onPhase('revealing')
    }
    void run()
    return () => {
      cancelled = true
      controls.forEach((control) => control.stop())
    }
    // Geometry and the callback are immutable for one selection.
  }, [
    geometry,
    onPhase,
    progress,
    travel,
    scale,
    distance,
    trajectory.duration,
    trajectory.overshoot,
    trajectory.progress,
  ])

  return (
    <>
      <svg
        className={styles.coverage}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        data-category={category}
      >
        <motion.path d={surface} className={styles.coverageSurface} data-coverage-surface />
        <motion.path d={border} className={styles.coverageBorder} />
      </svg>
      <motion.div
        className={styles.flyingIcon}
        data-category={category}
        data-flying-icon
        aria-hidden="true"
        style={{ x, y, scale, width: target.size, height: target.size }}
      >
        <span className={styles.iconRing} />
        <CategoryIcon category={category} size={mobile ? 32 : 42} />
      </motion.div>
    </>
  )
}

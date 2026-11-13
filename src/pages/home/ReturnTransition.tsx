import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { CategoryIcon } from '../../components/CategoryIcon'
import { returnRadius, transitionConfig } from './homeTransition'
import type { ReturnGeometry } from './homeTransition'
import styles from './HomePage.module.css'

// The corner circle grows over every layer in the category color; once the screen is
// covered the landing is restored underneath and the cover fades away.
export function ReturnTransition({
  geometry,
  covered,
  onCovered,
  onDone,
}: {
  geometry: ReturnGeometry
  covered: boolean
  onCovered: () => void
  onDone: () => void
}) {
  const { center, radius, category, width } = geometry
  const target = returnRadius(geometry)
  const size = useMotionValue(radius)
  const fill = useMotionValue(0)
  const icon = useMotionValue(1)
  const opacity = useMotionValue(1)
  const clipPath = useTransform(
    size,
    (value) => `circle(${value}px at ${center.x}px ${center.y}px)`,
  )

  useEffect(() => {
    let cancelled = false
    const controls: Array<{ stop: () => void }> = []
    async function run() {
      const grow = animate(size, target, {
        duration: transitionConfig.returnCover,
        ease: [0.55, 0, 0.75, 0.25],
      })
      controls.push(
        grow,
        animate(fill, 1, { duration: transitionConfig.returnCover, ease: 'easeIn' }),
        animate(icon, 0, { duration: transitionConfig.returnCover * 0.4 }),
      )
      await grow
      if (!cancelled) onCovered()
    }
    void run()
    return () => {
      cancelled = true
      controls.forEach((control) => control.stop())
    }
    // One expansion per return; the callback is stable.
  }, [geometry, target, size, fill, icon, onCovered])

  useEffect(() => {
    if (!covered) return
    const fade = animate(opacity, 0, { duration: transitionConfig.returnFade, ease: 'easeOut' })
    void fade.then(onDone)
    return () => fade.stop()
  }, [covered, opacity, onDone])

  const iconSize = width < 900 ? 32 : 42
  return (
    <motion.div
      className={styles.returnCover}
      data-category={category}
      data-return-cover={covered ? 'revealing' : 'covering'}
      aria-hidden="true"
      style={{ clipPath, opacity }}
    >
      <motion.span className={styles.returnFill} style={{ opacity: fill }} />
      <motion.span
        className={styles.returnIcon}
        style={{
          opacity: icon,
          left: center.x - iconSize / 2,
          top: center.y - iconSize / 2,
        }}
      >
        <CategoryIcon category={category} size={iconSize} />
      </motion.span>
    </motion.div>
  )
}

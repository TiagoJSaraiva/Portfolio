import { useId, useLayoutEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { CategoryId } from '../../data/types'
import { beltMarks } from './beltIcons'
import type { BeltMark } from './beltIcons'
import type { Point } from './homeTransition'
import { beltConfig, beltTile } from './beltConfig'
import styles from './SectorBelt.module.css'

const { columns, spacing, rowHeight, iconSize } = beltConfig

function Mark({ mark, x, y }: { mark: BeltMark; x: number; y: number }) {
  if ('icon' in mark) {
    const Icon = mark.icon
    return (
      <Icon
        x={x - iconSize / 2}
        y={y - iconSize / 2}
        size={iconSize}
        strokeWidth={1.5}
        data-belt-mark={mark.name}
      />
    )
  }
  const width = iconSize * (mark.scale ?? 1)
  return (
    <svg
      x={x - width / 2}
      y={y - iconSize / 2}
      width={width}
      height={iconSize}
      viewBox={mark.viewBox}
      fill="currentColor"
      data-belt-mark={mark.name}
    >
      {mark.paths.map((path, index) => (
        <path key={index} d={path.d} fillRule={path.evenOdd ? 'evenodd' : undefined} />
      ))}
    </svg>
  )
}

// A repeating pattern fills any sector size; the whole layer slides by one tile per loop.
export function SectorBelt({
  category,
  origin = { x: 0, y: 0 },
  startTime = null,
  className,
}: {
  category: CategoryId
  origin?: Point
  /** Shares another belt's timeline start so both slide in step. */
  startTime?: number | null
  className?: string
}) {
  const id = `belt-${useId().replace(/[^\w-]/g, '')}`
  const ref = useRef<SVGSVGElement>(null)
  const marks = beltMarks[category]

  useLayoutEffect(() => {
    const animation = ref.current?.getAnimations?.()[0]
    if (animation && startTime !== null) animation.startTime = startTime
  }, [startTime])

  return (
    <svg
      ref={ref}
      className={`${styles.belt}${className ? ` ${className}` : ''}`}
      data-sector-belt
      aria-hidden="true"
      focusable="false"
      style={
        {
          '--belt-tile': `${beltTile.width}px`,
          '--belt-duration': `${beltConfig.duration}s`,
        } as CSSProperties
      }
    >
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          x={origin.x}
          y={origin.y}
          width={beltTile.width}
          height={beltTile.height}
        >
          {marks.map((mark, index) => (
            <Mark
              key={`a-${mark.name}`}
              mark={mark}
              x={(index + 0.25) * spacing}
              y={rowHeight / 2}
            />
          ))}
          {marks.map((_, index) => (
            <Mark
              key={`b-${index}`}
              mark={marks[(index + columns / 2) % marks.length]}
              x={(index + 0.75) * spacing}
              y={rowHeight * 1.5}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

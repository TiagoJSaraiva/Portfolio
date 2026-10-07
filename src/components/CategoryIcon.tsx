import { Asterisk, Gamepad2, Globe2 } from 'lucide-react'
import type { CategoryId } from '../data/types'

export function CategoryIcon({ category, size = 20 }: { category: CategoryId; size?: number }) {
  const Icon = category === 'games' ? Gamepad2 : category === 'web' ? Globe2 : Asterisk
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
}

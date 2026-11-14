import type { Project } from '../../data/types'

// Starts downloading card artwork ahead of the trail, so selection animations overlap the requests.
export function preloadProjectImages(projects: readonly Project[]) {
  for (const { image } of projects) {
    if (!image) continue
    for (const source of [image.background, image.logo]) {
      if (!source) continue
      const preload = new Image()
      preload.decoding = 'async'
      preload.src = source
    }
  }
}

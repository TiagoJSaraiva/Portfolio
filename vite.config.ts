import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'
import { defineConfig } from 'vitest/config'

// Project artwork is authored as large PNGs. Cards show backgrounds at 340×220 and logos at 64 px
// tall, so production builds resize them for 2× screens and encode WebP. Development and tests keep
// the original files, whose names the tests rely on.
const projectArtwork = /\/assets\/projects\/[^/]+\/(bg|logo)\.png$/

function artworkDirectives(url: URL) {
  const match = projectArtwork.exec(url.pathname)
  if (!match) return new URLSearchParams()
  return match[1] === 'bg'
    ? new URLSearchParams({ w: '800', withoutEnlargement: '', format: 'webp', quality: '80' })
    : new URLSearchParams({ h: '128', format: 'webp', quality: '85' })
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      ...imagetools({ include: projectArtwork, defaultDirectives: artworkDirectives }),
      apply: 'build',
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})

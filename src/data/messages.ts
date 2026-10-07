import type { Localized } from './types'

export const messages = {
  home: { en: 'Home', pt: 'Início' },
  language: { en: 'Change language to Portuguese', pt: 'Mudar idioma para inglês' },
  explore: { en: 'Explore projects', pt: 'Explorar projetos' },
  selectedWork: { en: 'Selected work', pt: 'Projetos selecionados' },
  skills: { en: 'Tools of the trade', pt: 'Ferramentas de trabalho' },
  projectSkills: { en: 'Built with', pt: 'Feito com' },
  journey: { en: 'A little about the journey', pt: 'Um pouco da trajetória' },
  back: { en: 'Back to the journey', pt: 'Voltar à trajetória' },
  github: { en: 'View on GitHub', pt: 'Ver no GitHub' },
  visit: { en: 'Open project', pt: 'Abrir projeto' },
  demo: { en: 'Demo project', pt: 'Projeto demonstrativo' },
  demoNote: { en: 'Illustrative work. Project details and links are placeholders.', pt: 'Trabalho ilustrativo. Detalhes e links dos projetos são exemplos.' },
  empty: { en: 'New things are taking shape. Projects will appear here soon.', pt: 'Novas ideias estão tomando forma. Os projetos aparecerão aqui em breve.' },
  missingImage: { en: 'Preview coming soon', pt: 'Prévia em breve' },
  notFoundTitle: { en: 'A small detour.', pt: 'Um pequeno desvio.' },
  notFound: { en: 'This page or project could not be found. Let’s get you back on track.', pt: 'Esta página ou projeto não foi encontrado. Vamos voltar ao caminho.' },
  previous: { en: 'Previous projects', pt: 'Projetos anteriores' },
  next: { en: 'Next projects', pt: 'Próximos projetos' },
  pause: { en: 'Pause automatic scrolling', pt: 'Pausar rolagem automática' },
  play: { en: 'Resume automatic scrolling', pt: 'Retomar rolagem automática' },
  drag: { en: 'Drag to discover', pt: 'Arraste para descobrir' },
  skip: { en: 'Skip to content', pt: 'Pular para o conteúdo' },
  footer: { en: 'Curiosity, translated into code.', pt: 'Curiosidade, traduzida em código.' },
  categoryNav: { en: 'Explore other categories', pt: 'Explorar outras categorias' },
  profileGithub: { en: 'GitHub', pt: 'GitHub' },
  profileLinkedin: { en: 'LinkedIn', pt: 'LinkedIn' },
} satisfies Record<string, Localized>

export type MessageKey = keyof typeof messages

import type { Category, CategoryId, Profile, Project, Skill } from './types'

const artwork = import.meta.glob<string>('../assets/projects/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})
const githubUrl = 'https://github.com/TiagoJSaraiva/Portfolio'
const projectUrl = 'https://www.youtube.com'
export const copyrightYear = new Date().getFullYear()

export const profile: Profile = {
  name: 'Tiago Saraiva',
  role: { en: 'Designer & developer.', pt: 'Designer e desenvolvedor.' },
  invitation: {
    en: 'What kind of projects do you wanna see?',
    pt: 'Que tipo de projetos você deseja ver?',
  },
  githubUrl,
}

export const skills: Skill[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'react', label: 'React' },
  { id: 'css', label: 'CSS' },
  { id: 'motion', label: 'Motion' },
  { id: 'luau', label: 'Luau' },
  { id: 'roblox', label: 'Roblox Studio' },
  { id: 'gamedesign', label: 'Game Design' },
  { id: 'ui', label: 'UI / UX' },
  { id: 'python', label: 'Python' },
  { id: 'svg', label: 'SVG' },
  { id: 'audio', label: 'Web Audio' },
  { id: 'creative', label: 'Creative Coding' },
]

export const categories: Category[] = [
  {
    id: 'games',
    label: { en: 'Games', pt: 'Jogos' },
    tagline: {
      en: 'Games and game-related projects.',
      pt: 'Jogos e projetos relacionados a jogos.',
    }, // { en: 'Play. Discover. Repeat.', pt: 'Jogue. Descubra. Repita.' }
    headline: {
      en: 'Little worlds.\nBig possibilities.',
      pt: 'Pequenos mundos.\nGrandes possibilidades.',
    },
    description: {
      en: [
        'A space for the worlds I want to build: playful systems, memorable interactions, and the small details that make a game feel alive.',
        'These demo projects explore game mechanics, visual storytelling, and interface design. They are the starting point for a collection of real experiences.',
      ],
      pt: [
        'Um espaço para os mundos que quero construir: sistemas divertidos, interações memoráveis e os pequenos detalhes que dão vida a um jogo.',
        'Estes projetos demonstrativos exploram mecânicas de jogo, narrativa visual e interfaces. São o ponto de partida para uma coleção de experiências reais.',
      ],
    },
    skillIds: ['luau', 'roblox', 'gamedesign', 'ui', 'typescript'],
  },
  {
    id: 'web',
    label: { en: 'Web', pt: 'Web' },
    tagline: {
      en: 'Web systems, static websites, and other web projects.',
      pt: 'Sistemas web, sites estáticos e outros projetos web.',
    }, //{ en: 'Thoughtful by design.', pt: 'Pensado em cada detalhe.' }
    headline: {
      en: 'Good ideas deserve\ngreat interfaces.',
      pt: 'Boas ideias merecem\nótimas interfaces.',
    },
    description: {
      en: [
        'A place for turning ideas into useful, approachable experiences. I am interested in the meeting point between clear design and well-organized code.',
        'This illustrative collection explores responsive interfaces, thoughtful interactions, and components built to evolve. Real project stories will make their home here.',
      ],
      pt: [
        'Um lugar para transformar ideias em experiências úteis e acessíveis. Meu interesse está no encontro entre design claro e código bem organizado.',
        'Esta coleção ilustrativa explora interfaces responsivas, interações cuidadosas e componentes feitos para evoluir. As histórias dos projetos reais terão seu espaço aqui.',
      ],
    },
    skillIds: ['react', 'typescript', 'css', 'motion', 'ui'],
  },
  {
    id: 'misc',
    label: { en: 'Misc', pt: 'Misc' },
    tagline: {
      en: 'Desktop systems, APIs, scripts, experimental projects, among others.',
      pt: 'Sistemas para desktop, APIs, scripts, projetos experimentais, entre outros.',
    }, // { en: 'Follow the curiosity.', pt: 'Siga a curiosidade.' }
    headline: {
      en: 'Some ideas don’t\nfit in a box.',
      pt: 'Algumas ideias não\ncabem numa caixa.',
    },
    description: {
      en: [
        'The side paths are often the most interesting. This is a playground for experiments, useful little tools, and ideas that cross disciplines.',
        'From sound to generative visuals, these demo projects leave room for exploration. A collection for the things made simply because they could be made.',
      ],
      pt: [
        'Os caminhos alternativos costumam ser os mais interessantes. Este é um laboratório de experimentos, pequenas ferramentas úteis e ideias que cruzam disciplinas.',
        'Do som aos visuais generativos, estes projetos demonstrativos dão espaço à exploração. Uma coleção de coisas feitas pela vontade de descobrir.',
      ],
    },
    skillIds: ['python', 'typescript', 'svg', 'audio', 'creative'],
  },
]

const seeds: Record<
  CategoryId,
  {
    id: string
    title: string
    pt: string
    enSummary: string
    ptSummary: string
    skills: string[]
  }[]
> = {
  games: [
    {
      id: 'orbit',
      title: 'Orbit',
      pt: 'Orbit',
      enSummary: 'An adventure beyond the familiar.',
      ptSummary: 'Uma aventura além do conhecido.',
      skills: ['luau', 'roblox', 'gamedesign'],
    },
    {
      id: 'neon-rush',
      title: 'Neon Rush',
      pt: 'Neon Rush',
      enSummary: 'Find your rhythm in the city lights.',
      ptSummary: 'Encontre seu ritmo nas luzes da cidade.',
      skills: ['luau', 'gamedesign', 'ui'],
    },
    {
      id: 'little-grove',
      title: 'Little Grove',
      pt: 'Little Grove',
      enSummary: 'A small place to slow down.',
      ptSummary: 'Um pequeno lugar para desacelerar.',
      skills: ['roblox', 'gamedesign', 'ui'],
    },
    {
      id: 'echo',
      title: 'Echo',
      pt: 'Echo',
      enSummary: 'A puzzle of light and perspective.',
      ptSummary: 'Um quebra-cabeça de luz e perspectiva.',
      skills: ['luau', 'typescript', 'gamedesign'],
    },
  ],
  web: [
    {
      id: 'studio',
      title: 'Studio',
      pt: 'Studio',
      enSummary: 'A home for independent creative work.',
      ptSummary: 'Um espaço para criação independente.',
      skills: ['react', 'css', 'motion'],
    },
    {
      id: 'atlas',
      title: 'Atlas',
      pt: 'Atlas',
      enSummary: 'Your next destination, thoughtfully planned.',
      ptSummary: 'Seu próximo destino, pensado com cuidado.',
      skills: ['react', 'typescript', 'ui'],
    },
    {
      id: 'pulse',
      title: 'Pulse',
      pt: 'Pulse',
      enSummary: 'Making complex information feel simple.',
      ptSummary: 'Informações complexas de um jeito simples.',
      skills: ['react', 'typescript', 'css'],
    },
    {
      id: 'folio',
      title: 'Folio',
      pt: 'Folio',
      enSummary: 'An expressive canvas for good ideas.',
      ptSummary: 'Uma tela expressiva para boas ideias.',
      skills: ['css', 'motion', 'ui'],
    },
  ],
  misc: [
    {
      id: 'frequency',
      title: 'Frequency',
      pt: 'Frequency',
      enSummary: 'See the shape of sound.',
      ptSummary: 'Veja a forma do som.',
      skills: ['audio', 'typescript', 'creative'],
    },
    {
      id: 'generative',
      title: 'Generative',
      pt: 'Generative',
      enSummary: 'Order, chance, and everything between.',
      ptSummary: 'Ordem, acaso e tudo entre eles.',
      skills: ['svg', 'creative', 'typescript'],
    },
    {
      id: 'toolbox',
      title: 'Toolbox',
      pt: 'Toolbox',
      enSummary: 'Small tools for everyday friction.',
      ptSummary: 'Pequenas ferramentas para o dia a dia.',
      skills: ['python', 'typescript'],
    },
    {
      id: 'chromatic',
      title: 'Chromatic',
      pt: 'Chromatic',
      enSummary: 'A study in color and motion.',
      ptSummary: 'Um estudo sobre cor e movimento.',
      skills: ['svg', 'creative', 'css'],
    },
  ],
}

export const projects: Project[] = categories.flatMap(({ id: category }) =>
  seeds[category].map((seed, index) => ({
    id: seed.id,
    category,
    title: { en: seed.title, pt: seed.pt },
    summary: { en: seed.enSummary, pt: seed.ptSummary },
    description: {
      en: [
        seed.enSummary +
          ' This is an illustrative project created to explore how design, interaction, and code can work together.',
        'The concept brings together a focused visual identity, a clear interaction flow, and a modular approach to implementation. Every element is designed to support the experience, from the first impression to the smallest feedback.',
        'This space will eventually tell the real story: the challenge, the decisions behind the work, and what I learned along the way. For now, the artwork, description, and available links demonstrate the portfolio’s behavior.',
      ],
      pt: [
        seed.ptSummary +
          ' Este é um projeto ilustrativo criado para explorar como design, interação e código podem trabalhar juntos.',
        'O conceito reúne uma identidade visual consistente, um fluxo claro de interação e uma implementação modular. Cada elemento contribui para a experiência, da primeira impressão ao menor retorno visual.',
        'Este espaço contará a história real: o desafio, as decisões por trás do trabalho e o que aprendi no caminho. Por enquanto, a imagem, a descrição e os links disponíveis demonstram o funcionamento do portfólio.',
      ],
    },
    image: artwork[`../assets/projects/${seed.id}.svg`],
    skillIds: seed.skills,
    githubUrl: index === 0 || index === 1 ? githubUrl : undefined,
    projectUrl: index === 0 || index === 2 ? projectUrl : undefined,
    demo: true,
    year: '2026',
  })),
)

export const getCategory = (id: string | undefined) =>
  categories.find((category) => category.id === id)
export const getProjects = (category: CategoryId) =>
  projects.filter((project) => project.category === category)
export const getSkills = (ids: string[]) =>
  ids.flatMap((id) => {
    const skill = skills.find((item) => item.id === id)
    return skill ? [skill] : []
  })

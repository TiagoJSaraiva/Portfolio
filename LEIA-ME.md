# Tiago Saraiva — Portfólio

[English](README.md)

Portfólio pessoal de Tiago Saraiva, designer e desenvolvedor. Apresenta jogos, projetos web e experimentos criativos.

**Site:** https://tiagojsaraiva.github.io/Portfolio/

## Destaques

- **Landing interativa:** três setores (Jogos, Web e Misc) se encontram num ponto comum. Cada um tem uma bola que pode ser clicada, focada ou arrastada para qualquer setor.
- **Transições animadas entre categorias:** o setor escolhido cobre a tela, a bola voa até o canto com overshoot e uma esteira contínua de projetos sobe para a vista.
- **Esteira de projetos:** carrossel com rolagem automática que pausa com hover, foco, arraste ou o controle explícito. Arrastar nunca abre links, e a ativação por teclado continua funcionando depois do arraste.
- **Inglês e português:** interface, conteúdo, rótulos de acessibilidade e mensagens de erro são traduzidos. O idioma escolhido é lembrado quando o navegador permite armazenamento.
- **Acessível desde o início:** botões nativos, foco visível, link para pular ao conteúdo e ícones com nome acessível. `prefers-reduced-motion` desativa o movimento automático e os deslocamentos animados.
- **URLs compartilháveis:** as categorias abrem diretamente por `#/games`, `#/web` e `#/misc`.
- **Totalmente estático:** sem servidor, banco de dados ou CMS. Todo o conteúdo fica em TypeScript tipado e assets locais.

## Tecnologias

React 19, TypeScript (estrito), Vite, React Router (rotas com hash), Motion, Embla Carousel, Lucide e CSS Modules. Ferramentas: pnpm, Oxlint, Prettier, Vitest + Testing Library e Playwright.

## Como rodar localmente

Requisitos: Node.js 22+ e pnpm 9 (`corepack enable` usa a versão fixada no `package.json`).

```bash
pnpm install
pnpm dev
```

| Comando                | Função                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Servidor de desenvolvimento                                   |
| `pnpm build`           | Verificação estrita de tipos e build de produção em `dist/`   |
| `pnpm preview`         | Serve o build de produção localmente                          |
| `pnpm lint`            | Oxlint                                                        |
| `pnpm format:check`    | Verifica a formatação (`pnpm format` aplica)                  |
| `pnpm test`            | Testes de componentes e contratos de dados (Vitest + jsdom)   |
| `pnpm test:e2e`        | Testes no navegador Chromium (Playwright)                     |
| `pnpm artwork`         | Regenera as artes SVG provisórias                             |

Antes do primeiro `pnpm test:e2e`, instale o navegador com `pnpm exec playwright install chromium`.

## Estrutura

```
src/
  app/         providers, idioma e rotas
  pages/home/  telas de landing e categoria, com geometria e transições
  features/    comportamento compartilhado de projetos, carrossel e habilidades
  components/  interface reutilizável, sem conteúdo pessoal
  data/        contratos tipados, perfil, categorias, projetos, habilidades e textos
  styles/      tokens de design e regras globais
  assets/      artes dos projetos, importadas pelo Vite
e2e/           testes do Playwright
scripts/       gerador das artes provisórias
```

## Como editar o conteúdo

| Conteúdo                                     | Fonte                                   |
| -------------------------------------------- | --------------------------------------- |
| Nome, apresentação, GitHub e LinkedIn        | `src/data/portfolio.ts` → `profile`     |
| Categorias                                   | `src/data/portfolio.ts` → `categories`  |
| Catálogo de habilidades                      | `src/data/portfolio.ts` → `skills`      |
| Projetos                                     | `src/data/portfolio.ts` → `seeds`       |
| Textos da interface e mensagens              | `src/data/messages.ts`                  |
| Tipos e campos disponíveis                   | `src/data/types.ts`                     |

- Textos traduzidos exigem `en` e `pt`.
- Os IDs de categoria são `games`, `web` e `misc`. IDs de projeto devem ser únicos e estáveis, pois fazem parte dos links compartilháveis.
- Referencie habilidades por ID e acrescente novas habilidades ao catálogo antes de usá-las.
- As artes ficam em `src/assets/projects/<Projeto>/`, como `bg.png` e um `logo.png` opcional, importados pelo Vite. Mantenha os PNGs em tamanho original: o build de produção os redimensiona (fundos com 800 px de largura, logos com 128 px de altura) e converte para WebP com `vite-imagetools`, enquanto desenvolvimento e testes usam os originais. Imagens ausentes ou quebradas exibem o card traduzido "Prévia em breve".
- Os links `github` e `access` são opcionais e independentes. Um link sem URL é omitido por completo.

## Publicação

Todo push na `main` executa o [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que roda lint, verificação de formatação, testes unitários, build de produção e a suíte do Playwright. O site só é publicado no GitHub Pages se tudo passar. Pull requests executam as mesmas verificações, sem publicar.

O build usa base relativa (`base: './'`) e rotas com hash, então funciona no subcaminho `/Portfolio/` sem reescrita no servidor. Ao selecionar uma categoria, as artes dela começam a ser baixadas durante a transição, e os cards costumam estar prontos quando a esteira aparece.

## Licença

Todos os direitos reservados. O código-fonte é público apenas para consulta e referência. Código, artes, textos e identidade visual não podem ser copiados, modificados ou redistribuídos sem permissão.

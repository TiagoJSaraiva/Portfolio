# Guia do projeto

## Diretórios e contexto

- O aplicativo está em `portfolio/`, com React, TypeScript, Vite e pnpm. O `package.json` da raiz não é o aplicativo.
- Documentação relevante está em `/docs`. Leia `docs/arquitetura.md` e `docs/conteudo.md` antes de alterar arquitetura ou conteúdo.
- `docs/instrucao.txt` preserva o pedido original; `wireframes/Paginas.pdf` é a referência para composição e interações.
- Não há servidor, banco de dados ou CMS. Todo o conteúdo é declarado em TypeScript e assets locais.

## Comandos

Execute da raiz com `pnpm --dir portfolio <comando>`, ou dentro de `portfolio/`:

- `pnpm dev`: desenvolvimento.
- `pnpm build`: TypeScript estrito e build de produção.
- `pnpm lint`: Oxlint; corrija também os avisos introduzidos.
- `pnpm test`: testes de componentes e contratos de dados com Vitest.
- `pnpm test:e2e`: testes reais em Chromium com Playwright. Na primeira execução, use `pnpm exec playwright install chromium` dentro do aplicativo.
- `pnpm format:check`: verifica formatação; `pnpm format` formata apenas código, sem tocar nos README.
- `pnpm artwork`: regenera apenas as imagens SVG demonstrativas; não utilize para substituir imagens reais.

Use pnpm e mantenha `portfolio/pnpm-lock.yaml` atualizado. Não introduza lockfiles de outros gerenciadores.

## Organização e responsabilidades

- `src/app`: providers, idioma e rotas. Navegação usa React Router com hash; projeto aberto pertence à URL.
- `src/pages/home`: composição artística exclusiva da entrada. Mantenha geometria, decoração e animações locais; mudanças nessa tela não devem alterar os componentes de categoria.
- `src/pages/category`: composição responsiva dos modos Jogos, Web e Misc.
- `src/features`: comportamento compartilhado de projetos, trajetória/carrossel e habilidades.
- `src/components`: elementos reutilizáveis sem conteúdo pessoal fixo.
- `src/data`: contratos tipados, perfil, categorias, projetos, habilidades e textos da interface.
- `src/styles`: tokens e regras globais. Estilos de componentes usam CSS Modules.

Use os tipos existentes, props explícitas e estado local para interações. Não acrescente stores globais ou camadas de abstração sem necessidade concreta. Preserve TypeScript estrito e não contorne erros com `any` ou supressões.

## Conteúdo e tradução

- Inglês é o padrão. EN/PT deve cobrir interface, conteúdo, acessibilidade e mensagens de erro; a escolha é persistida quando o navegador permite armazenamento.
- Conteúdo pessoal fica em `src/data/portfolio.ts`; textos de interface em `src/data/messages.ts`; contratos em `src/data/types.ts`.
- IDs de categorias são `games`, `web`, `misc`. IDs de projetos devem ser únicos e estáveis, pois fazem parte dos links compartilháveis.
- Referencie habilidades por ID. Não duplique nomes e descrições nos componentes.
- `githubUrl`, `projectUrl` e links sociais são opcionais. Sem URL, omita o link inteiro; não crie botões desabilitados nem `href="#"`.
- Os projetos atuais são explicitamente demonstrativos. Não transforme textos de exemplo em afirmações sobre experiência profissional real.
- Imagens reais pertencem a `src/assets`; importe-as pelo Vite. Evite caminhos absolutos que presumem publicação na raiz de um domínio.

## Design e interação

- Fundo grafite; violeta para Jogos, ciano para Web e âmbar para Misc. Use os tokens de categoria, sem duplicar paletas.
- Desktop: Jogos tem projetos à direita; Web à esquerda; Misc acima. Abaixo de 900 px, projetos vêm antes do painel e habilidades depois.
- Cards expandem na direção da lista e deslocam os seguintes. Preserve rolagem e seleção por teclado/toque.
- A faixa contínua pertence ao painel de trajetória; pausa com hover, foco, arraste e controle explícito. Arrastar não deve abrir um projeto.
- Respeite `prefers-reduced-motion`; desative movimento automático e deslocamentos animados. Preserve foco visível e nomes acessíveis de ícones.
- Projeto selecionado substitui trajetória e habilidades. Links de GitHub/acesso ficam no rodapé; voltar à trajetória restaura a categoria na URL.

## Validação e Git

- Antes de concluir um módulo, execute build, lint e os testes relevantes. Alterações de layout/carrossel exigem teste em navegador, além de jsdom.
- Confira 360, 768 e 1440 px, sem rolagem horizontal da página, conteúdo cortado ou ações dependentes apenas de hover.
- Teste URLs diretas, histórico, idioma, quatro combinações de links, ausência de imagem e estados vazios. No carrossel, preserve os casos de arraste para fora do painel e ativação por Enter após arrastar.
- O usuário autorizou commits por módulo concluído na `main`. Não faça push.
- Não altere os README nem o `package.json` da raiz nesta etapa. Hospedagem no GitHub Pages será configurada posteriormente; não acrescente deploy ou CI de publicação sem novo pedido.


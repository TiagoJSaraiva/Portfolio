# Guia do projeto

## Diretórios e contexto

- O aplicativo está em `portfolio/`, com React, TypeScript, Vite e pnpm. O `package.json` da raiz não é o aplicativo.
- Documentação relevante está em `/docs`. Leia `docs/arquitetura.md` e `docs/conteudo.md` antes de alterar arquitetura ou conteúdo.
- Para pedidos relacionados a issues mencionados no prompt, consulte e siga também `docs/issue-workflow.md`; as instruções desse arquivo são válidas nesses casos.
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

- `src/app`: providers, idioma e rotas. Navegação usa React Router com hash; categoria aberta pertence à URL. Rotas de detalhes de projetos ficam para uma etapa futura.
- `src/pages/home`: composição persistente da entrada e categoria, com geometria, decoração e sequência de transição locais. Preserve a composição montada ao navegar entre essas telas.
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
- Desktop: setores convergem em 50% da largura e um terço da altura. Abaixo de 900 px, apresentação vem antes dos blocos retangulares contíguos, com divisórias de largura total.
- Seleção executa cobertura, voo com overshoot e subida da esteira. Cards da esteira têm título, imagem e links externos independentes; detalhes internos, trajetória e habilidades ficam para depois.
- A faixa contínua da categoria pausa com hover, foco, arraste e controle explícito. Arrastar não deve abrir links; Enter após arrastar continua funcionando.
- Respeite `prefers-reduced-motion`; desative movimento automático e deslocamentos animados. Preserve foco visível e nomes acessíveis de ícones.
- O círculo no canto superior esquerdo volta à landing e restaura foco/rolagem. Links diretos de categoria abrem o estado final. EN/PT e sociais ficam sobre a página, sem logo, rodapé ou faixa visual de cabeçalho.

## Validação e Git

- Antes de concluir um módulo, execute build, lint e os testes relevantes. Alterações de layout/carrossel exigem teste em navegador, além de jsdom.
- Confira 360, 768 e 1440 px, sem rolagem horizontal da página, conteúdo cortado ou ações dependentes apenas de hover.
- Teste URLs diretas, histórico, idioma, quatro combinações de links, ausência de imagem e estados vazios. No carrossel, preserve os casos de arraste para fora do painel e ativação por Enter após arrastar.
- O usuário autorizou commits por módulo concluído na `main`. Não faça push.
- Não altere os README nem o `package.json` da raiz nesta etapa. Hospedagem no GitHub Pages será configurada posteriormente; não acrescente deploy ou CI de publicação sem novo pedido.


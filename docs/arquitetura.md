# Arquitetura e decisões

## Aplicativo estático

O aplicativo vive em `portfolio/`. React e TypeScript cuidam da interface, Vite do desenvolvimento/build e pnpm das dependências. Não existem backend, banco, consultas remotas de conteúdo ou autenticação. As fontes são hospedadas junto do aplicativo.

As versões resolvidas estão no lockfile. Bibliotecas de interação: React Router, Motion, Embla React + Auto Scroll e Lucide. Os logotipos de GitHub/LinkedIn usam SVG local, pois a versão atual do Lucide não exporta marcas. CSS Modules preservam o isolamento; o CSS global contém tokens, fontes e acessibilidade básica.

## Navegação e estado

| URL após o hash | Tela |
| --- | --- |
| `/` | Landing page |
| Qualquer outro caminho | Redireciona para `/` |

Os três setores centrais são botões sem ação. Não há navegação para categorias ou projetos. O seletor EN/PT continua disponível na landing page; URLs antigas de categorias e projetos redirecionam à raiz.

O contexto de idioma inicia em inglês e permite EN/PT. Uma escolha válida é salva em `tiago-portfolio-locale`; armazenamento bloqueado não impede o uso da interface. O documento recebe `lang` e título atualizados. Interações locais ficam nos componentes responsáveis.

A troca de idioma coordena duas fases no mesmo contexto: 150 ms de fade out e 450 ms de revelação. `LocalizedText` recebe um valor `Localized<string>` e anima somente textos diferentes entre os idiomas. A função do texto define a entrada, independentemente do tamanho: títulos, rótulos e controles usam a variante padrão `label`, com revelação por grafemas; corpos de texto usam `variant="body"`, com fade do texto inteiro durante os 450 ms. Isso inclui apresentação, convites, descrições, resumos, taglines, notas, mensagens explicativas e rodapé, mesmo quando renderizados em `span`. Corpos de texto não são segmentados nem criam elementos por letra. Na revelação por grafemas, todas as palavras começam juntas; atrasos proporcionais à posição das letras fazem palavras curtas e longas terminar juntas. Espaços e quebras de linha são preservados. Sem `Intl.Segmenter`, a entrada de títulos e rótulos também usa fade inteiro.

A escolha é persistida no clique. EN/PT mantêm suas posições e começam imediatamente a animação de tamanho/cor; durante a troca, o botão usa `aria-disabled` e ignora novas ativações sem perder foco. Idioma efetivo, atributos acessíveis e título do documento mudam após o fade out. A revelação mantém uma versão acessível completa e oculta as letras visuais dos leitores de tela; ao terminar, remove os elementos temporários. Um único temporizador ativo coordena a página, sem atualizações do React por letra ou quadro.

Carregamento inicial e restauração do idioma salvo não animam os textos. Movimento reduzido troca imediatamente; ativar essa preferência durante o efeito também conclui a troca. Navegar durante qualquer fase conclui o idioma solicitado antes de apresentar a página de destino, preservando o comportamento de foco e histórico.

## Composição

`HomePage` e `HomeSector` ficam isolados em `src/pages/home`. No desktop, os polígonos de Jogos, Web e Misc têm a mesma área, com junção em 50% da largura e um terço da altura. A apresentação sobrepõe a junção. Abaixo de 900 px, a apresentação precede três blocos iguais empilhados.

## Movimento e acessibilidade

Motion controla a entrada da landing page. `MotionConfig` respeita a preferência do sistema, complementado por CSS para movimento reduzido. Os setores usam botões nativos, com foco visível e ativação por teclado/toque; por enquanto, não executam ação. O link de pular para o conteúdo e os nomes acessíveis permanecem disponíveis.

## Verificação

Vitest + Testing Library + jsdom verificam componentes e a troca de idioma. O comportamento visual da landing page é verificado em Chromium com Playwright nas larguras de referência. Screenshots e traces são gerados em `portfolio/test-results/`, ignorado pelo Git. O servidor de teste é local; nenhuma publicação é realizada.

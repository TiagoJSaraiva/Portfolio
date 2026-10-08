# Arquitetura e decisões

## Aplicativo estático

O aplicativo vive em `portfolio/`. React e TypeScript cuidam da interface, Vite do desenvolvimento/build e pnpm das dependências. Não existem backend, banco, consultas remotas de conteúdo ou autenticação. As fontes são hospedadas junto do aplicativo.

As versões resolvidas estão no lockfile. Bibliotecas de interação: React Router, Motion, Embla React + Auto Scroll e Lucide. Os logotipos de GitHub/LinkedIn usam SVG local, pois a versão atual do Lucide não exporta marcas. CSS Modules preservam o isolamento; o CSS global contém tokens, fontes e acessibilidade básica.

## Navegação e estado

| URL após o hash | Tela |
| --- | --- |
| `/` | Entrada artística |
| `/games`, `/web`, `/misc` | Trajetória e projetos de uma categoria |
| `/:categoryId/:projectId` | Projeto no painel da categoria |

Categorias/projetos inexistentes mostram a tela 404, inclusive um projeto pertencente a outra categoria. Idioma não muda a rota nem o projeto selecionado. Atualizar e compartilhar a URL preserva a seleção; voltar/avançar usa o histórico do navegador.

O contexto de idioma inicia em inglês e permite EN/PT. Uma escolha válida é salva em `tiago-portfolio-locale`; armazenamento bloqueado não impede o uso da interface. O documento recebe `lang` e título atualizados. Estado de hover, arraste e pausa fica nos componentes responsáveis.

A troca de idioma coordena duas fases no mesmo contexto: 150 ms de fade out e 450 ms de revelação. `LocalizedText` recebe um valor `Localized<string>` e anima somente textos diferentes entre os idiomas. Todas as palavras começam juntas; atrasos proporcionais à posição dos grafemas fazem palavras curtas e longas terminar juntas. Espaços e quebras de linha são preservados. Parágrafos usam a prop `paragraph`: com 140 ou mais grafemas no idioma de destino, a entrada usa fade do texto inteiro para limitar o custo de renderização. A contagem para ao atingir esse limite, sem criar arrays de letras para textos longos. Sem `Intl.Segmenter`, a entrada de qualquer texto também usa fade inteiro.

A escolha é persistida no clique. EN/PT mantêm suas posições e começam imediatamente a animação de tamanho/cor; durante a troca, o botão usa `aria-disabled` e ignora novas ativações sem perder foco. Idioma efetivo, atributos acessíveis e título do documento mudam após o fade out. A revelação mantém uma versão acessível completa e oculta as letras visuais dos leitores de tela; ao terminar, remove os elementos temporários. Um único temporizador ativo coordena a página, sem atualizações do React por letra ou quadro.

Carregamento inicial e restauração do idioma salvo não animam os textos. Movimento reduzido troca imediatamente; ativar essa preferência durante o efeito também conclui a troca. Navegar durante qualquer fase conclui o idioma solicitado antes de apresentar a página de destino, preservando o comportamento de foco e histórico.

## Composição

`HomePage` e `HomeSector` ficam isolados em `src/pages/home`. No desktop, os polígonos de Jogos, Web e Misc têm a mesma área, com junção em 50% da largura e um terço da altura. A apresentação sobrepõe a junção, permitindo que os setores continuem clicáveis. Abaixo de 900 px, a apresentação precede três blocos iguais empilhados.

`CategoryPage` monta `ProjectRail`, `JourneyPanel` e `SkillList`. O grid espelha Jogos/Web e coloca a lista horizontal acima do painel em Misc. No celular/tablet, todos os modos exibem projetos, painel e habilidades nessa ordem. Descrições não têm truncamento; no desktop o texto do projeto flui ao lado da imagem e continua abaixo dela.

## Movimento e acessibilidade

Motion controla entrada e mudanças de posição. CSS anima tamanho dos cards e indicadores. `MotionConfig` respeita a preferência do sistema, complementado por CSS para movimento reduzido.

O carrossel usa Embla com arraste livre e Auto Scroll. Para mais de um projeto, repete três grupos visuais para sustentar o loop em painéis largos. Só o primeiro grupo integra a sequência de Tab; as cópias continuam clicáveis e ficam ocultas dos leitores de tela. Zero projetos omite a faixa e um projeto desativa movimento automático e controles de avanço. As pausas de hover e foco nos controles abrangem o painel inteiro; pausa explícita permanece até o usuário retomá-la. O título recebe foco de orientação sem bloquear a reprodução inicial. Arraste mantém a pausa até a liberação, inclusive fora do painel. Preferência por movimento reduzido desativa reprodução automática.

Links e botões usam nomes acessíveis, foco visível, Enter/Space conforme sua semântica e alvos apropriados ao toque. A navegação direciona o foco ao título; há um link de pular para o conteúdo. Falha de imagem produz um fallback traduzido.

A ativação por Enter nas imagens navega diretamente pela rota. Isso evita que a supressão de cliques do Embla após um arraste bloqueie uma ativação de teclado. Preserve a cobertura de arraste seguido de Enter ao alterar esse comportamento.

## Verificação

Vitest + Testing Library + jsdom verificam contratos, navegação, tradução e conteúdo condicional. Embla é substituído nos testes de componentes, pois jsdom não fornece layout; seu comportamento real é verificado em Chromium com Playwright.

Playwright verifica as três larguras de referência, imagens, ausência de overflow, histórico, foco, idioma, expansão, reprodução/pausa, arraste, movimento reduzido e toque. Screenshots e traces são gerados em `portfolio/test-results/`, ignorado pelo Git. O servidor de teste é local; nenhuma publicação é realizada.

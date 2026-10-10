# Arquitetura e decisões

## Aplicativo estático

O aplicativo vive em `portfolio/`. React e TypeScript cuidam da interface, Vite do desenvolvimento/build e pnpm das dependências. Não existem backend, banco, consultas remotas de conteúdo ou autenticação. As fontes são hospedadas junto do aplicativo.

As versões resolvidas estão no lockfile. Bibliotecas de interação: React Router, Motion, Embla React + Auto Scroll e Lucide. Os logotipos de GitHub/LinkedIn usam SVG local, pois a versão atual do Lucide não exporta marcas. CSS Modules preservam o isolamento; o CSS global contém tokens, fontes e acessibilidade básica.

## Navegação e estado

| URL após o hash | Tela |
| --- | --- |
| `/` | Landing page |
| `/games`, `/web`, `/misc` | Categoria com esteira de projetos |
| Qualquer outro caminho | Redireciona para `/` |

Os três setores abrem as categorias. A URL muda no clique do setor ou na soltura da bola; uma composição React persistente coordena `idle → covering → flying → revealing → ready`, sem remontar ao trocar de rota. A geometria é medida na seleção, incluindo escala de hover, deslocamento da bola e posição de rolagem. Links diretos, recarga e avanço no histórico abrem a categoria pronta; voltar cancela animações pendentes. O círculo da categoria no canto superior esquerdo volta à landing e restaura o foco e a rolagem do setor selecionado. Rotas internas de projetos ainda não estão ativas.

O contexto de idioma inicia em inglês e permite EN/PT. Uma escolha válida é salva em `tiago-portfolio-locale`; armazenamento bloqueado não impede o uso da interface. O documento recebe `lang` e título atualizados. Interações locais ficam nos componentes responsáveis.

A troca de idioma coordena duas fases no mesmo contexto: 150 ms de fade out e 450 ms de revelação. `LocalizedText` recebe um valor `Localized<string>` e anima somente textos diferentes entre os idiomas. A função do texto define a entrada, independentemente do tamanho: títulos, rótulos e controles usam a variante padrão `label`, com revelação por grafemas; corpos de texto usam `variant="body"`, com fade do texto inteiro durante os 450 ms. Isso inclui apresentação, convites, descrições, resumos, taglines, notas, mensagens explicativas e rodapé, mesmo quando renderizados em `span`. Corpos de texto não são segmentados nem criam elementos por letra. Na revelação por grafemas, todas as palavras começam juntas; atrasos proporcionais à posição das letras fazem palavras curtas e longas terminar juntas. Espaços e quebras de linha são preservados. Sem `Intl.Segmenter`, a entrada de títulos e rótulos também usa fade inteiro.

A escolha é persistida no clique. EN/PT mantêm suas posições e começam imediatamente a animação de tamanho/cor; durante a troca, o botão usa `aria-disabled` e ignora novas ativações sem perder foco. Idioma efetivo, atributos acessíveis e título do documento mudam após o fade out. A revelação mantém uma versão acessível completa e oculta as letras visuais dos leitores de tela; ao terminar, remove os elementos temporários. Um único temporizador ativo coordena a página, sem atualizações do React por letra ou quadro.

Carregamento inicial e restauração do idioma salvo não animam os textos. Movimento reduzido troca imediatamente; ativar essa preferência durante o efeito também conclui a troca. Navegar durante qualquer fase conclui o idioma solicitado antes de apresentar a página de destino, preservando o comportamento de foco e histórico.

## Composição

`HomePage`, `HomeSector` e a transição ficam isolados em `src/pages/home`. No desktop, os polígonos de Jogos, Web e Misc têm a mesma área, com junção em 50% da largura e um terço da altura. A apresentação sobrepõe a junção. Abaixo de 900 px, a apresentação precede três blocos retangulares contíguos, com divisórias de largura total. O logo e o rodapé foram removidos. O cabeçalho é uma camada transparente fixa de controles EN/PT e sociais, sem faixa, fundo, borda ou espaço reservado no fluxo.

As bolas da landing são renderizadas por portals em uma camada fixa acima da apresentação e abaixo dos controles do cabeçalho, fora do recorte dos setores. Cada botão preserva um espaço reservado na posição original; somente círculo, anel e ícone se deslocam. Textos e divisórias permanecem fixos, e os três botões continuam sendo os únicos controles de categoria no percurso de teclado.

`useLandingInteraction` coordena localmente registro das bolas, geometria, bloqueio da atração e um único gesto ativo. Motion Values atualizam a translação sem renders React por quadro; a escala de hover fica no elemento interno. `landingInteraction.ts` concentra a mola amortecida, proximidade, limites e constantes: atração de mouse em raio de 160 px com deslocamento máximo de 24 px no desktop, ou 120 px/16 px abaixo de 900 px. A distância é calculada a partir da origem, com intensidade que cai suavemente até zero no limite; afastar o cursor devolve a bola à origem. Foco visível suspende a atração daquela categoria. Observação de tamanho, carregamento de fontes e rolagem mantêm as origens atualizadas.

Pressionar uma bola congela a atração das três e preserva o ponto de contato. O arraste começa após 6 px, por mouse ou toque, com captura do ponteiro e limites que mantêm círculo e anel na área visível, considerando a escala atual. A bola pode atravessar setores e mantém sua categoria. Soltar seleciona uma única vez, sem clique adicional; seu centro permanece no ponto de soltura durante os 700 ms da cobertura e depois inicia o voo existente. A atração permanece bloqueada até retornar de uma categoria à landing, quando posições, foco e rolagem são restaurados antes da reativação.

A cobertura é um caminho SVG opaco grafite com acento de categoria. Web e Jogos giram a divisória inferior ao redor da junção até a superior; Misc gira ambas em sentidos opostos. Os outros setores são encobertos pela superfície em movimento. No celular, os limites superior e inferior do bloco selecionado expandem simultaneamente até os limites da tela. A apresentação e os textos selecionados somem por fade; o círculo é representado em uma camada acima da cobertura, sem corte pelo setor.

Após a cobertura, o círculo voa ao canto superior esquerdo, mantendo 104 px no desktop e 78 px abaixo de 900 px. A aceleração é constante até o limite de velocidade; a duração depende da distância medida. O overshoot escala com a velocidade alcançada, com limites que preservam o círculo e seu anel dentro da tela. As constantes de cobertura, fade, voo, acomodação e subida ficam em `homeTransition.ts`. Ao estabilizar o círculo, a esteira sobe de baixo com desaceleração; só então inicia a rolagem horizontal contínua para a esquerda.

O carrossel compartilhado admite apresentações `journey` (componentes antigos, sem rota ativa) e `trail` (categoria atual), e um controle `autoStart`. A esteira mostra título, imagem, indicação demonstrativa e links externos opcionais independentes. Nenhum card abre detalhes internos nesta etapa. Trajetória e habilidades permanecem disponíveis no código para uma etapa futura.

Quando o círculo termina o voo e o overshoot, o título da categoria aparece à sua direita, alinhado ao centro do círculo. A fase `revealing` também ativa a prop `reveal` de `LocalizedText`, reutilizando a revelação por grafemas e os mesmos tempos da troca de idioma (450 ms no total). Ao terminar a entrada da esteira, o título passa a texto normal; trocas EN/PT continuam coordenadas pelo contexto de idioma. Links diretos e movimento reduzido exibem o título imediatamente.

## Movimento e acessibilidade

Motion controla a sequência usando valores animados, sem renders React por quadro. As fases avançam pela conclusão dos efeitos. Novas seleções são ignoradas durante a transição; navegação cancela os controles ativos. Redimensionar ou ativar movimento reduzido durante o efeito conclui no layout atualizado. Movimento reduzido abre o estado final imediatamente e desativa a rolagem automática. Os setores e o retorno usam botões nativos com foco visível e ativação por teclado/toque. O link de pular para o conteúdo e os nomes acessíveis permanecem disponíveis.

Na landing, Enter e Espaço selecionam pelo botão do setor; a bola não acrescenta outra parada de teclado. `touch-action: none` fica restrito à bola, preservando a rolagem fora dela. Escape, cancelamento do ponteiro, perda inesperada de captura, perda de foco da janela e redimensionamento cancelam o gesto sem navegar e restauram as posições; a atração continua bloqueada. Movimento reduzido desativa atração e retornos animados, mas mantém manipulação direta por arraste; ao soltar, a categoria abre imediatamente. Ativar essa preferência durante um gesto cancela o arraste e restaura a origem.

O gesto registra o tamanho inicial da tela e o confere na soltura, garantindo cancelamento mesmo se o evento de redimensionamento ainda estiver pendente. O botão de retorno também aceita a liberação de um toque curto dentro de seus limites: isso mantém o retorno disponível quando o navegador não sintetiza um clique após o arraste. Deslocar 6 px ou cancelar esse toque não executa o retorno; clique e teclado continuam disponíveis, sem navegação duplicada.

A esteira pausa com hover, foco, arraste e controle explícito; também permite navegação manual. O arraste permanece em pausa até o ponteiro ser liberado, mesmo fora da faixa, e não ativa links. Enter abre links mesmo após arrastar. Cópias para continuidade visual não acrescentam controles ao percurso de teclado ou à árvore acessível. Categorias vazias exibem mensagem traduzida; um projeto único não inicia movimento automático. Imagens ausentes ou quebradas usam o fallback traduzido existente.

## Verificação

Vitest + Testing Library + jsdom verificam componentes, troca de idioma, geometria da atração e contratos dos gestos. Chromium com Playwright verifica atração, arraste entre setores, limites do anel, ponto de soltura durante a cobertura, teclado, cancelamento, histórico e retorno nas larguras de referência; eventos de toque reais também verificam arraste e rolagem mobile. Nos testes com relógio simulado, ele é instalado antes de carregar a página para que Motion use a mesma fonte de tempo desde a inicialização. Screenshots e traces são gerados em `portfolio/test-results/`, ignorado pelo Git. O servidor de teste é local; nenhuma publicação é realizada.

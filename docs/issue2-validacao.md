# Validação da issue #2

## Comportamento entregue

A troca usa 150 ms de fade out e 450 ms de entrada. Palavras começam juntas e revelam seus grafemas da esquerda para a direita; o fim da revelação independe do tamanho da palavra. O seletor mantém EN/PT nas posições atuais e ignora novas ativações enquanto a troca estiver em curso. Navegação ou movimento reduzido concluem a troca imediatamente.

Em 08/10/2026, o critério foi ajustado a pedido do usuário: **todos os corpos de texto usam fade inteiro**, independentemente do comprimento. Apresentação, convites, descrições, resumos, taglines, notas e mensagens explicativas usam `variant="body"`. Títulos, rótulos e controles mantêm a revelação por letras. Corpos de texto não são segmentados nem criam elementos por letra. Sem `Intl.Segmenter`, qualquer texto usa fade inteiro.

Os subtítulos da entrada passam a quebrar linhas abaixo de 900 px: a regra anterior de `nowrap` cortava o conteúdo atual no celular. A composição e os polígonos de desktop foram preservados. Conteúdo pessoal permaneceu igual; somente a formatação das três taglines foi ajustada para passar no Prettier.

## Medição de produção anterior ao ajuste por função

Medições realizadas em 07/10/2026 com Chromium headless **153.0.8010.12**, em builds isolados da versão anterior (`58891c0`, com as alterações locais de scrollbar) e da implementação `3d58341`. Essa implementação usava o critério de 140 grafemas por parágrafo, substituído pelo critério de função em 08/10. Os valores abaixo são históricos e não são medições do novo critério. Nenhuma fixture de desempenho foi inserida nos dados do aplicativo entregue.

A rota medida foi `#/web/studio`, em 360 e 1440 px, altura de 960 px, sem movimento reduzido. Cada combinação recebeu uma execução de aquecimento e três execuções medidas de EN para PT, com recarga, armazenamento limpo e fontes carregadas. Foram observados intervalos de `requestAnimationFrame`, tarefas longas, elementos temporários e o tempo até liberar o seletor. CPU 4× é uma desaceleração artificial aplicada pelo Chrome DevTools Protocol; não representa um modelo específico de celular.

O cenário longo substituiu somente a descrição do projeto, em cópias temporárias, por 100 repetições de frases traduzidas (aproximadamente 4.700–5.600 caracteres, incluindo espaços). As tabelas mostram medianas das três execuções. P95 é o percentil 95 dos intervalos entre quadros dentro de cada execução; preparação inclui a espera de renderização após os 150 ms de saída, não apenas a segmentação da string.

| Largura | CPU | Conteúdo | P95 anterior | P95 final | Preparação final | Troca final |
| --- | --- | --- | --- | --- | --- | --- |
| 360 | normal | atual | 16,7 ms | 16,8 ms | 22,6 ms | 656 ms |
| 360 | normal | longo | 16,8 ms | 16,8 ms | 19,5 ms | 652 ms |
| 1440 | normal | atual | 16,8 ms | 16,8 ms | 23,9 ms | 686 ms |
| 1440 | normal | longo | 16,8 ms | 16,8 ms | 18,7 ms | 674 ms |
| 360 | 4× | atual | 33,3 ms | 333,4 ms | 144,6 ms | 1.153 ms |
| 360 | 4× | longo | 16,8 ms | 416,6 ms | 193,6 ms | 1.252 ms |
| 1440 | 4× | atual | 16,8 ms | 583,3 ms | 204,8 ms | 1.761 ms |
| 1440 | 4× | longo | 33,3 ms | 566,6 ms | 209,6 ms | 1.609 ms |

Na versão final, o pico foi **333 letras** tanto no conteúdo atual quanto no longo. O DOM chegou a 532/524 elementos, respectivamente, e retornou a 163/159 ao terminar, iguais às contagens iniciais. Não foram observadas tarefas longas acima de 50 ms com CPU normal nessas execuções. Na CPU 4×, tarefas longas chegaram a 333 ms em 360 px e 566 ms em 1440 px.

Antes do ajuste, a revelação integral criou aproximadamente 800 letras no conteúdo atual e 5.100 no sintético longo; uma execução longa em CPU 4× ultrapassou 10 s. O ajuste contém o custo dos parágrafos longos, mas **a versão final ainda apresenta pausas importantes sob CPU 4×**. Os 600 ms são a duração nominal das fases; processamento e renderização podem prolongar o tempo real. Movimento reduzido continua disponível pela preferência do sistema e elimina o efeito.

## Verificações da implementação anterior (`3d58341`)

- Build TypeScript/Vite, Oxlint e Prettier sem erros ou avisos.
- Vitest: 41 testes, incluindo limite de 139/140 grafemas compostos, emojis, espaços, quebras de linha, estados vazios, imagem ausente, parágrafos em quantidades diferentes e armazenamento bloqueado.
- Playwright: 16 testes, incluindo revelação e fade reais, foco e teclado, interrupções por navegação/movimento reduzido, três larguras nos dois idiomas, título completo, ausência de overflow, subtítulos móveis contidos nos cards e dimensões estáveis após remover as letras.
- Regressões de URLs diretas, histórico, persistência, quatro combinações de links, expansão, toque, pausa do carrossel, arraste para fora do painel e Enter após arrastar.

Screenshots e o JSON das medições da sessão ficam em `portfolio/test-results/`, ignorado pelo Git. As limitações de CPU acima motivaram a primeira revisão do efeito; o critério atual segue a função de cada texto.

## Verificações do ajuste por função (08/10/2026)

- Build TypeScript/Vite, lint e verificação de formatação aprovados.
- Vitest: 42 testes. O mesmo texto com 1, 139 e 140 grafemas compostos é revelado por letras no título e por fade inteiro no corpo, inclusive em `span`; o cenário de texto longo também mantém o conteúdo completo.
- Playwright: 16 testes aprovados em Chromium. Em 360, 768 e 1440 px, nos dois idiomas, corpos de texto e taglines usam fade inteiro de 450 ms sem elementos por letra. Títulos e rótulos mantêm a revelação original; layout, acessibilidade, limpeza, navegação e carrossel passam pelas verificações existentes.
- As medições de desempenho acima não foram repetidas neste ajuste.

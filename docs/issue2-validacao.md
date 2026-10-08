# Validação da issue #2

## Comportamento entregue

A troca usa 150 ms de fade out e 450 ms de entrada. Palavras começam juntas e revelam seus grafemas da esquerda para a direita; o fim da revelação independe do tamanho da palavra. O seletor mantém EN/PT nas posições atuais e ignora novas ativações enquanto a troca estiver em curso. Navegação ou movimento reduzido concluem a troca imediatamente.

Após medir o custo da animação integral, o usuário escolheu fade do texto inteiro para parágrafos com **140 ou mais grafemas no idioma de destino**. Textos curtos mantêm a revelação por letras. A contagem é interrompida no limite e parágrafos longos não criam elementos por letra. Sem `Intl.Segmenter`, qualquer texto usa fade inteiro.

Os subtítulos da entrada passam a quebrar linhas abaixo de 900 px: a regra anterior de `nowrap` cortava o conteúdo atual no celular. A composição e os polígonos de desktop foram preservados. Conteúdo pessoal permaneceu igual; somente a formatação das três taglines foi ajustada para passar no Prettier.

## Medição de produção

Medições realizadas em 07/10/2026 com Chromium headless **153.0.8010.12**, em builds isolados da versão anterior (`58891c0`, com as alterações locais de scrollbar) e da versão final. Nenhuma fixture de desempenho foi inserida nos dados do aplicativo entregue.

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

## Verificações

- Build TypeScript/Vite, Oxlint e Prettier sem erros ou avisos.
- Vitest: 41 testes, incluindo limite de 139/140 grafemas compostos, emojis, espaços, quebras de linha, estados vazios, imagem ausente, parágrafos em quantidades diferentes e armazenamento bloqueado.
- Playwright: 16 testes, incluindo revelação e fade reais, foco e teclado, interrupções por navegação/movimento reduzido, três larguras nos dois idiomas, título completo, ausência de overflow, subtítulos móveis contidos nos cards e dimensões estáveis após remover as letras.
- Regressões de URLs diretas, histórico, persistência, quatro combinações de links, expansão, toque, pausa do carrossel, arraste para fora do painel e Enter após arrastar.

Screenshots e o JSON das medições da sessão ficam em `portfolio/test-results/`, ignorado pelo Git. A preferência por fade inteiro nos parágrafos longos e as limitações de CPU acima fazem parte da decisão tomada durante a implementação.

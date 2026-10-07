# Como substituir os exemplos

## Onde editar

| Conteúdo | Fonte |
| --- | --- |
| Nome, apresentação, convite, GitHub e LinkedIn | `portfolio/src/data/portfolio.ts` → `profile` |
| Trajetória e habilidades gerais de cada categoria | `categories` |
| Catálogo de habilidades | `skills` |
| Projetos demonstrativos | `seeds` e `projects` |
| Textos dos controles e mensagens | `portfolio/src/data/messages.ts` |
| Tipos e campos disponíveis | `portfolio/src/data/types.ts` |

`en` e `pt` são obrigatórios nos textos traduzidos. Nomes próprios e nomes de tecnologias podem ser iguais nos dois idiomas. A lista de parágrafos mantém textos longos editáveis sem inserir HTML no conteúdo.

## Adicionar um projeto real

Importe uma imagem local e inclua um objeto `Project` na lista `projects` (ou substitua o gerador demonstrativo por uma lista explícita). Exemplo:

```ts
import preview from '../assets/meu-projeto.webp'

const projeto: Project = {
  id: 'meu-projeto',
  category: 'web',
  title: { en: 'My project', pt: 'Meu projeto' },
  summary: { en: 'Short summary.', pt: 'Resumo curto.' },
  description: {
    en: ['The challenge.', 'Implementation and learnings.'],
    pt: ['O desafio.', 'Implementação e aprendizados.'],
  },
  image: preview,
  skillIds: ['react', 'typescript'],
  githubUrl: 'https://github.com/seu-perfil/seu-projeto',
  projectUrl: 'https://seu-projeto.example',
  year: '2026',
  demo: false,
}
```

O projeto aparecerá automaticamente na categoria, na faixa e na rota `#/web/meu-projeto`. Mantenha IDs estáveis após publicar links. Habilidades devem existir no catálogo; acrescente uma nova habilidade ali antes de referenciá-la.

Se `image` estiver ausente ou não carregar, a interface apresenta “Preview coming soon”/“Prévia em breve”. Forneça uma imagem com proporção próxima de 800×520; os cards usam recorte com `object-fit: cover`.

## Links opcionais

Remova `githubUrl` ou `projectUrl` quando não houver um destino. Sem ambas, a área de ações é omitida. Os links externos abrem em outra aba com `noopener noreferrer`.

Atualmente, o primeiro exemplo de cada categoria tem os dois links, o segundo tem apenas GitHub, o terceiro apenas acesso ao projeto e o quarto nenhum. Todos os GitHub apontam para `https://github.com/TiagoJSaraiva/Portfolio`; acessos ao projeto apontam para `https://www.youtube.com`. São placeholders autorizados, não os destinos reais dessas obras.

LinkedIn não aparece porque `profile.linkedinUrl` ainda não foi fornecido. Basta preencher uma URL real para o ícone ser exibido; o mesmo comportamento vale para GitHub.

## Imagens demonstrativas e cuidados

As doze imagens locais são SVGs produzidos por `portfolio/scripts/generate-demo-artwork.mjs`; `pnpm artwork` as regenera. Não use esse comando para substituir assets reais. O carregamento das imagens de exemplo é feito por `import.meta.glob`; imagens de projetos reais podem ser importadas explicitamente.

Os testes do contrato atual exigem doze exemplos com quatro combinações por categoria. Ao trocar pela coleção real, atualize esse cenário com os dados reais e preserve a cobertura das combinações de links usando fixtures de teste.

README e deploy ficam para uma etapa posterior. Os documentos desta pasta registram o funcionamento atual e devem acompanhar futuras mudanças relevantes.

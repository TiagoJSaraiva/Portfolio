# Como substituir os exemplos

As categorias estão ativas em `#/games`, `#/web` e `#/misc`. O clique na landing revela a esteira após a cobertura e o voo do ícone. Os dados abaixo alimentam seus cards; trajetória, habilidades e detalhes internos dos projetos ficam para uma etapa futura.

## Onde editar

| Conteúdo                                          | Fonte                                         |
| ------------------------------------------------- | --------------------------------------------- |
| Nome, apresentação, convite, GitHub e LinkedIn    | `portfolio/src/data/portfolio.ts` → `profile` |
| Trajetória e habilidades gerais de cada categoria | `categories`                                  |
| Catálogo de habilidades                           | `skills`                                      |
| Projetos demonstrativos                           | `seeds` e `projects`                          |
| Textos dos controles e mensagens                  | `portfolio/src/data/messages.ts`              |
| Tipos e campos disponíveis                        | `portfolio/src/data/types.ts`                 |

`en` e `pt` são obrigatórios nos textos traduzidos. Nomes próprios e nomes de tecnologias podem ser iguais nos dois idiomas. A lista de parágrafos mantém textos longos editáveis sem inserir HTML no conteúdo.

## Adicionar um projeto real

Guarde a arte em uma pasta do projeto dentro de `portfolio/src/assets/projects/`, com os arquivos `bg.png` e `logo.png`. Importe os dois arquivos pelo Vite e declare o par no objeto do projeto. Exemplo:

```ts
import background from "../assets/projects/MeuProjeto/bg.png";
import logo from "../assets/projects/MeuProjeto/logo.png";

const projeto: Project = {
  id: "meu-projeto",
  category: "web",
  title: { en: "My project", pt: "Meu projeto" },
  description: {
    en: ["The challenge.", "Implementation and learnings."],
    pt: ["O desafio.", "Implementação e aprendizados."],
  },
  image: { background, logo },
  skillIds: ["react", "typescript"],
  github: "https://github.com/seu-perfil/seu-projeto",
  access: "https://seu-projeto.example",
  year: "2026",
  demo: false,
};
```

O projeto aparece na esteira da categoria definida pelo campo `category`. IDs de categoria válidos são `games`, `web` e `misc`; mantenha IDs de projeto únicos e estáveis para futuros links compartilháveis. A rota `#/web/meu-projeto` ainda não está ativa. Habilidades devem existir no catálogo; acrescente uma nova habilidade ali antes de referenciá-la.

O background preenche o card com `object-fit: cover`; o logo fica sobreposto no centro, com 64 px de altura e largura proporcional. Se `image` estiver ausente, ou se o background ou logo não carregar, a interface apresenta “Preview coming soon”/“Prévia em breve”.

## Links opcionais

Declare `github` e `access` somente quando houver um destino. Cada link é independente; sem ambos, a área de ações é omitida. Os links externos abrem em outra aba com `noopener noreferrer`. `profile.githubUrl` continua sendo o campo do link social do cabeçalho.

Multiverse Heroes declara os links reais para seu repositório e página no Roblox. Os demais projetos demonstrativos não têm links até que seus destinos sejam declarados nos respectivos objetos.

LinkedIn não aparece porque `profile.linkedinUrl` ainda não foi fornecido. Basta preencher uma URL real para o ícone ser exibido; o mesmo comportamento vale para GitHub. Os controles sociais e EN/PT ficam sobre a página em um cabeçalho transparente; não há logo nem rodapé.

## Imagens demonstrativas e cuidados

`pnpm artwork` regenera SVGs demonstrativos, mas esses arquivos não são atribuídos automaticamente aos projetos. Declare a imagem de cada projeto com imports locais explícitos; não use arte demonstrativa para substituir assets reais.

Nos `seeds`, os campos opcionais `image`, `github` e `access` pertencem ao projeto correspondente. Multiverse Heroes é o exemplo atual de imagem composta; os outros projetos exibem o fallback até receberem seus próprios assets.

Os testes de contrato mantêm os doze exemplos demonstrativos e cobrem as quatro combinações possíveis dos links opcionais com fixtures.

README e deploy ficam para uma etapa posterior. Os documentos desta pasta registram o funcionamento atual e devem acompanhar futuras mudanças relevantes.

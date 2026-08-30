# Hunt Vault

Dashboard para importar, sincronizar e analisar relatórios de Party Hunt do jogo Tibia.

O projeto funciona no navegador, salva os dados primeiro no IndexedDB através do Dexie e sincroniza Party Hunts pelo serviço Go.

O serviço de sincronização fica em [`../server/`](../server/readme.md).

## Funcionalidades

- Importação de Party Hunts pelo clipboard.
- Gráficos de loot, supplies e dano usando uPlot.
- Normalização das métricas para valores por hora.
- Ranking médio dos membros da party.
- Pesquisa de monstros, habilidades e runas com catálogo TibiaData cacheado localmente e detalhes da TibiaWiki.

## Tecnologias

- SolidJS
- TypeScript
- Vite
- Vanilla Extract
- Dexie
- uPlot
- Biome

## Requisitos

- Node.js `>= 24`
- Yarn ou npm
- Navegador com suporte a IndexedDB e clipboard

## Instalação

```bash
git clone <url-do-repositorio>
cd hunt-vault
cd client
yarn install
```

Também é possível instalar as dependências com npm:

```bash
npm install
```

## Desenvolvimento

Em desenvolvimento, a URL padrão da API é `http://localhost:8080`. Em produção, o frontend usa a própria origem com `/api`, resultando em `https://hunt.zelchi.com/api`. Depois que um relatório válido é colado e aparece na pré-visualização, o frontend solicita a API Key caso ela ainda não esteja salva e a mantém no armazenamento local deste navegador. Só então o envio pode ser feito por **Salvar resultado**.

Inicie o servidor de desenvolvimento:

```bash
yarn dev
```

Depois, abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `yarn dev` | Inicia o servidor de desenvolvimento |
| `yarn build` | Gera a versão de produção em `dist/` |
| `yarn typecheck` | Verifica os tipos TypeScript sem gerar arquivos |
| `yarn preview` | Exibe localmente a versão de produção |
| `yarn lint` | Executa o lint do Biome |
| `yarn check:biome` | Verifica formatação e regras do Biome |
| `yarn format` | Formata os arquivos do projeto |
| `yarn deploy` | Publica `dist/` usando GitHub Pages |

## Como usar

1. Abra a aba **Import**.
2. Copie o relatório de Party Hunt.
3. Clique em **Colar do clipboard**.
4. Confira o conteúdo capturado.
5. Se for solicitado, informe a API Key no modal e confirme.
6. Clique em **Salvar resultado**.
7. Abra a aba **Party** para consultar os dados.

O navegador pode solicitar permissão para acessar o clipboard. Esse recurso normalmente exige `localhost` ou uma conexão HTTPS.

Party Hunts são colocadas em uma fila local e sincronizadas automaticamente. O frontend mantém uma conexão SSE com a API; ao receber uma atualização, executa `pull` a partir do último cursor persistido.

A busca mantém o catálogo TibiaData no armazenamento local por até 24 horas para abrir rapidamente. Para monstros, o painel mostra somente Resistências e Loot: esses dados são buscados na TibiaWiki usando o identificador estável da entidade e, quando a página ou o infobox não está disponível, a TibiaData é usada como fallback estruturado.

O gateway de produção deve remover o prefixo `/api` e encaminhar `https://hunt.zelchi.com/api/*` para `http://localhost:8080/*`. O `push` recebe a API Key enviada pelo navegador; `pull` e SSE não exigem chave. Para `/api/v1/sync/events`, o gateway deve manter a conexão aberta e desabilitar buffering e cache.

Se uma operação autenticada responder `401` ou `403`, a API Key é considerada inválida e removida automaticamente do armazenamento local. Ela será solicitada novamente antes do próximo envio.

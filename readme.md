# Hunt Vault

Dashboard local para importar, armazenar e analisar relatórios de caçadas do jogo Tibia gerados pelo Hunt Analyser.

O projeto funciona diretamente no navegador, sem backend. Os dados ficam salvos localmente usando IndexedDB através do Dexie.

## Funcionalidades

- Importação de relatórios pelo clipboard.
- Gráficos de XP, loot, supplies, dano e healing usando uPlot.
- Normalização das métricas para valores por hora.
- Ranking médio dos membros da party.

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
yarn install
```

Também é possível instalar as dependências com npm:

```bash
npm install
```

## Desenvolvimento

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
| `yarn preview` | Exibe localmente a versão de produção |
| `yarn lint` | Executa o lint do Biome |
| `yarn check:biome` | Verifica formatação e regras do Biome |
| `yarn format` | Formata os arquivos do projeto |
| `yarn deploy` | Publica `dist/` usando GitHub Pages |

## Como usar

1. Abra a aba **Import**.
2. Copie o relatório gerado pelo Hunt Analyser.
3. Clique em **Colar do clipboard**.
4. Confira o conteúdo capturado.
5. Clique em **Salvar resultado**.
6. Use as abas **Solo** ou **Party** para consultar os dados.

O navegador pode solicitar permissão para acessar o clipboard. Esse recurso normalmente exige `localhost` ou uma conexão HTTPS.

# Hunt Vault

Aplicação para importar, consultar e analisar relatórios de *Party Hunt* do Tibia. O client funciona localmente com IndexedDB e pode sincronizar as caçadas entre navegadores por meio da API.

## Stack

- **Client:** SolidJS, TypeScript, Vite e Vanilla Extract
- **API:** Go, Gin, GORM e SQLite
- **Produção:** um único processo Go serve o client na raiz e a API em `/api`

## Requisitos

- Node.js `>= 24`
- Yarn `1.x`
- Go `1.24` ou superior
- Docker com Docker Compose, para executar em container

## Desenvolvimento

Instale as dependências uma vez:

```bash
make install
```

Inicie o client e a API juntos:

```bash
make dev
```

Depois, abra <http://localhost:5173>. A API estará disponível diretamente em <http://localhost:8080>.

O alvo `make dev` usa uma chave fixa apenas para desenvolvimento local. A chave usada em produção deve ser configurada no `.env` do Compose.

## Produção com Docker

Gere uma chave exclusiva para o ambiente e configure as variáveis:

```bash
cp .env.example .env
openssl rand -hex 32
```

Coloque o valor gerado em `SYNC_API_KEY` no arquivo `.env` e suba a aplicação:

```bash
docker compose up --build
```

O endereço público será <http://localhost:8080> (ou a porta definida em `PORT`). Nesse modo:

- `/` serve o client compilado;
- `/api/health` e `/api/v1/sync/*` são atendidos pela mesma API;
- os dados do SQLite ficam no volume Docker `hunt-vault-data`.

O container expõe a porta `8080` por padrão. O [edge-proxy](https://github.com/Zelchi/edge-proxy) pode apontar a rota do domínio diretamente para esse container; ele deve encaminhar o caminho original, incluindo `/api`.

Por exemplo, quando os containers compartilham uma rede Docker, o upstream da rota pode ser `http://hunt-vault:8080`. Não é necessário criar uma rota separada para o client e para a API.

Para executar em segundo plano:

```bash
docker compose up -d --build
```

Para acompanhar os logs e parar a aplicação:

```bash
docker compose logs -f
docker compose down
```

O comando `docker compose down` não remove o volume do banco. Para removê-lo explicitamente, use `docker compose down -v`.

## Comandos úteis

```bash
make install       # instala dependências do client e baixa módulos Go
make dev           # inicia client e API em paralelo
make build         # gera o build do client
make test          # executa testes da API e typecheck do client
```

Os comandos específicos também podem ser executados nos diretórios `client` e `server`. A documentação local de cada serviço está em [client/readme.md](client/readme.md) e [server/readme.md](server/readme.md).

## API

Quando acessada pelo container, a API usa o prefixo `/api`:

| Método | Endpoint | Autenticação |
| --- | --- | --- |
| `GET` | `/api/health` | Não |
| `GET` | `/api/v1/sync/pull?since=0` | Não |
| `POST` | `/api/v1/sync/push` | `Authorization: Bearer <SYNC_API_KEY>` |
| `GET` | `/api/v1/sync/events` | Não |

Internamente, o processo Go continua usando `/health` e `/v1/sync/*`; o próprio servidor remove o prefixo `/api` antes de encaminhar a requisição ao router da API. Os caminhos sem prefixo continuam disponíveis para o desenvolvimento local.

## GitHub Pages

O build do client continua podendo ser publicado separadamente com `cd client && yarn deploy`. Para o novo modelo de implantação, use o build completo pelo Docker Compose: em produção o client já assume a API no mesmo domínio, em `/api`.

# Hunt Vault API

API de sincronização exclusiva para Party Hunts, escrita em Go com Gin, GORM e SQLite. O dialeto SQLite usado é escrito em Go puro (`github.com/glebarez/sqlite`), sem exigir CGO. Não há contas de usuário: a API usa uma única chave de sincronização.

## Executar

1. Copie `.env.example` para `.env` e defina uma chave aleatória com pelo menos 32 bytes.
2. Baixe as dependências: `go mod tidy`.
3. Inicie: `go run ./cmd`.

O servidor inicia em `http://localhost:8080` por padrão. O arquivo SQLite é criado automaticamente em `data/hunt-vault.db`.

Em desenvolvimento, o frontend acessa essa URL diretamente. Em produção, o gateway remove o prefixo `/api` e encaminha `https://hunt.zelchi.com/api/*` para `http://localhost:8080/*`. O frontend envia o header `Authorization` apenas no `push`; a API também responde ao preflight CORS necessário durante o desenvolvimento.

## Rotas

- `GET /health`
- `POST /v1/sync/push` — envia Party Hunts locais
- `GET /v1/sync/pull?since=<cursor>` — traz Party Hunts posteriores ao cursor
- `GET /v1/sync/events` — avisa em tempo real quando um `push` foi confirmado

Somente a rota de escrita (`POST /v1/sync/push`) requer `Authorization: Bearer <SYNC_API_KEY>`. A leitura (`GET /v1/sync/pull`) e o stream SSE (`GET /v1/sync/events`) são públicos.

Cada item enviado contém `session_data`, os nomes dos `members`, o `payload` que será preservado e, opcionalmente, o `fingerprint` calculado pelo cliente:

```json
{
  "hunts": [
    {
      "fingerprint": "ef58851b...",
      "session_data": "From 2026-08-29, 19:00:00 to 2026-08-29, 20:00:00",
      "members": ["Alice", "Bob"],
      "payload": { "rawText": "..." }
    }
  ]
}
```

## Estrutura

- `cmd` — inicialização e encerramento do servidor HTTP.
- `internal` — configuração, rotas, persistência e sincronização.
- `test` — testes de integração da API pública.

## Validação

```bash
go test ./...
go vet ./...
```

### Deduplicação

O fingerprint é o SHA-256 de uma representação normalizada de `session_data` e dos nomes únicos dos membros, em ordem alfabética. A API sempre recalcula essa identidade e rejeita um fingerprint divergente enviado pelo cliente.

A tabela `party_hunts` usa o fingerprint como chave primária. Envios simultâneos da mesma caçada convergem para um único snapshot, cuja versão é incrementada. O cursor de `pull` é o campo `cursor` devolvido pela própria API.

### Atualização em tempo real

`GET /v1/sync/events` mantém uma conexão Server-Sent Events aberta. Logo após conectar, a API envia `event: ready`. Depois de cada `push` confirmado no banco, ela envia:

```text
id: 1788044400000
event: sync
data: {"cursor":1788044400000,"fingerprints":["ef58851b..."]}
```

O evento é apenas um aviso: ao conectar, reconectar ou receber `sync`, o cliente executa `pull` usando seu último cursor persistido. Assim, nenhum dado é perdido se a conexão cair ou se um cliente lento deixar de receber um aviso intermediário. A conexão recebe um comentário de heartbeat a cada 15 segundos.

O frontend consome o stream com `fetch` e leitura incremental do corpo para manter o mesmo cliente de sincronização; o `EventSource` nativo não é necessário.

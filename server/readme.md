# Hunt Vault API

## Executar localmente

Requisitos:

- Go instalado

No diretório do servidor:

```bash
cd server
copy .env.example .env
go mod download
go run ./cmd
```

Defina `SYNC_API_KEY` no arquivo `.env` antes de iniciar o servidor.

O server consulta serviços externos por meio de `PROXY_API_URL`. O valor padrão é `https://api.increasesoft.com/api`; altere-o apenas se o upstream mudar.

Para servir um build do client pelo próprio processo Go, defina `STATIC_DIR` apontando para o diretório `dist`. Nesse modo, o client fica em `/` e a API também pode ser acessada com o prefixo `/api`.

O servidor ficará disponível em `http://localhost:8080`.

A rota `GET /proxy/*path` faz proxy para o caminho correspondente no upstream configurado. Quando o server é usado pelo client ou pelo container, ela fica disponível com o prefixo `/api`; por exemplo, `/api/proxy/respawns/search`.

## Testes

```bash
go test ./...
go vet ./...
```

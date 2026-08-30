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

O servidor ficará disponível em `http://localhost:8080`.

## Testes

```bash
go test ./...
go vet ./...
```
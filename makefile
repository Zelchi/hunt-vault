help:
	@printf '%s\n' \
		'make install       instala as dependências' \
		'make dev           inicia client e API em paralelo' \
		'make build         gera o build do client' \
		'make test          executa os testes da API e o typecheck do client'

install:
	cd client && yarn install --frozen-lockfile
	cd server && go mod download

dev:
	@set -eu; \
	(cd server && exec env ADDR=":8080" DATABASE_PATH="../data/hunt-vault.db" SYNC_API_KEY="hunt-vault-development-key-change-me-0123456789" go run ./cmd) & api_pid=$$!; \
	(cd client && exec env VITE_SYNC_API_URL="http://localhost:8080" yarn dev --host "127.0.0.1" --port "5173") & client_pid=$$!; \
	stop_children() { kill "$$api_pid" "$$client_pid" 2>/dev/null || true; wait "$$api_pid" "$$client_pid" 2>/dev/null || true; }; \
	terminate() { stop_children; exit 0; }; \
	trap terminate INT TERM; \
	trap 'stop_children' EXIT; \
	wait

build:
	cd client && yarn build

test:
	cd server && go test ./...
	cd client && yarn typecheck
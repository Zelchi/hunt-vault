# syntax=docker/dockerfile:1

FROM node:24-alpine AS client-build

WORKDIR /src/client

COPY client/package.json client/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY client/ ./
RUN yarn build

FROM golang:1.24-alpine AS api-build

WORKDIR /src/server

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/hunt-vault-api ./cmd

FROM alpine:3.21

ENV ADDR=":8080" \
    DATABASE_PATH="/app/data/hunt-vault.db" \
    STATIC_DIR="/app/client" \
    GIN_MODE="release"

RUN addgroup -S huntvault \
    && adduser -S -G huntvault huntvault \
    && mkdir -p /app/client /app/data \
    && chown -R huntvault:huntvault /app

COPY --from=client-build /src/client/dist/ /app/client/
COPY --from=api-build /out/hunt-vault-api /usr/local/bin/hunt-vault-api

RUN chown huntvault:huntvault /usr/local/bin/hunt-vault-api

VOLUME ["/app/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/api/health >/dev/null || exit 1

USER huntvault
ENTRYPOINT ["/usr/local/bin/hunt-vault-api"]

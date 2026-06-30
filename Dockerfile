# ============================================================
# Unified RefRef Dockerfile with multi-stage builds
# Targets: webapp-runner (default), api-runner, refer-runner
# ============================================================

# ---- Base image ----
FROM node:24-alpine AS base-node
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

# ============================================================
# WEBAPP (default target)
# ============================================================
FROM base-node AS webapp-builder
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/webapp/package.json ./apps/webapp/
COPY packages/attribution-script/package.json ./packages/attribution-script/
COPY packages/auth/package.json ./packages/auth/
COPY packages/coredb/package.json ./packages/coredb/
COPY packages/email-templates/package.json ./packages/email-templates/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/id/package.json ./packages/id/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY packages/widget/package.json ./packages/widget/
RUN pnpm install --frozen-lockfile --filter @refref/webapp... --ignore-scripts
COPY apps/webapp ./apps/webapp
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @refref/webapp...
ENV DATABASE_URL="postgresql://placeholder"
ENV BETTER_AUTH_SECRET="placeholder-secret-for-build"
RUN pnpm build --filter @refref/webapp...

FROM base-node AS webapp-runner
RUN apk add --no-cache curl ca-certificates bash
WORKDIR /app
# Use api-builder's full node_modules (has everything) + webapp dist
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/packages ./packages
COPY --from=webapp-builder /app/apps/webapp ./apps/webapp
COPY --from=webapp-builder /app/package.json ./package.json
COPY --from=webapp-builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=webapp-builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=webapp-builder /app/turbo.json ./turbo.json
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-builder /app/apps/api/openapi.yaml ./apps/api/openapi.yaml
ENV NODE_ENV=production
EXPOSE 3000 3001
WORKDIR /app/apps/webapp
CMD ["pnpm", "start"]

# ============================================================
# API
# ============================================================
FROM base-node AS api-builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" build
WORKDIR /app/apps/api
RUN pnpm build

FROM base-node AS api-runner
RUN apk add --no-cache curl ca-certificates bash && \
    curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | distro=alpine version=3.18.0 codename= bash && \
    apk add infisical && \
    update-ca-certificates
WORKDIR /app
COPY --from=api-builder /app/pnpm-workspace.yaml .
COPY --from=api-builder /app/package.json .
COPY --from=api-builder /app/pnpm-lock.yaml .
COPY --from=api-builder /app/packages ./packages
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-builder /app/apps/api/openapi.yaml ./apps/api/openapi.yaml
COPY --from=api-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
RUN pnpm install --frozen-lockfile --prod
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "start"]

# ============================================================
# REFER
# ============================================================
FROM base-node AS refer-builder
RUN apk add --no-cache curl ca-certificates bash && \
    curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | distro=alpine version=3.18.0 codename= bash && \
    apk add infisical && \
    update-ca-certificates
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/refer ./apps/refer
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "./packages/*" build
WORKDIR /app/apps/refer
RUN pnpm build

FROM base-node AS refer-runner
RUN apk add --no-cache curl ca-certificates bash && \
    curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.alpine.sh' | distro=alpine version=3.18.0 codename= bash && \
    apk add infisical && \
    update-ca-certificates
WORKDIR /app
COPY --from=refer-builder /app/pnpm-workspace.yaml .
COPY --from=refer-builder /app/package.json .
COPY --from=refer-builder /app/pnpm-lock.yaml .
COPY --from=refer-builder /app/packages ./packages
COPY --from=refer-builder /app/apps/refer/dist ./apps/refer/dist
COPY --from=refer-builder /app/apps/refer/package.json ./apps/refer/package.json
COPY --from=refer-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
RUN pnpm install --frozen-lockfile --prod
WORKDIR /app/apps/refer
EXPOSE 3000
CMD ["pnpm", "start"]

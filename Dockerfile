# syntax=docker/dockerfile:1
FROM node:22 AS builder

# Fail the build if the local Node/npm major drifts from this image instead
# of silently producing a differently-resolved node_modules.
ENV npm_config_engine_strict=true
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build against a reachable, seeded catalog DB. Secrets exist only in this
# RUN's environment: never ARG/ENV layers or files copied into the runner.
# docker build --secret id=DATABASE_URI,env=DATABASE_URI \
#   --secret id=PAYLOAD_SECRET,env=PAYLOAD_SECRET -t npf .
RUN --mount=type=secret,id=DATABASE_URI,required=true \
    --mount=type=secret,id=PAYLOAD_SECRET,required=true \
    DATABASE_URI="$(cat /run/secrets/DATABASE_URI)" \
    PAYLOAD_SECRET="$(cat /run/secrets/PAYLOAD_SECRET)" npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json /usr/src/app/package-lock.json /usr/src/app/next.config.ts ./
RUN mkdir -p media && chown node:node media
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]

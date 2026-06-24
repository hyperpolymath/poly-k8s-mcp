# SPDX-License-Identifier: MPL-2.0
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

FROM cgr.dev/chainguard/wolfi-base:latest

LABEL org.opencontainers.image.title="poly-k8s-mcp"
LABEL org.opencontainers.image.description="Unified MCP server for Kubernetes orchestration: kubectl, helm, kustomize"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="Jonathan D.A. Jewell"
LABEL org.opencontainers.image.source="https://github.com/hyperpolymath/poly-k8s-mcp"
LABEL org.opencontainers.image.licenses="MIT"
LABEL dev.mcp.server="true"
LABEL io.modelcontextprotocol.server.name="io.github.hyperpolymath/poly-k8s-mcp"

# Install Deno and kubectl
RUN apk add --no-cache deno ca-certificates kubectl helm

# Create non-root user
RUN adduser -D -u 1000 mcp
WORKDIR /app

# Copy application files
COPY --chown=mcp:mcp deno.json package.json ./
COPY --chown=mcp:mcp main.js ./
COPY --chown=mcp:mcp lib/ ./lib/
COPY --chown=mcp:mcp src/ ./src/ 2>/dev/null || true

# Cache dependencies
RUN deno cache main.js || true

# Switch to non-root user
USER mcp

# Kubernetes config via mount or environment
ENV KUBECONFIG=/home/mcp/.kube/config

ENTRYPOINT ["deno", "run", "--allow-run", "--allow-read", "--allow-write", "--allow-env", "--allow-net", "main.js"]

# SPDX-License-Identifier: MPL-2.0
# poly-k8s-mcp module manifest for FlatRacoon orchestrator

{
  name = "poly-k8s-mcp",
  version = "0.1.0",
  layer = 'platform,
  description = "MCP tool server providing kubectl, helm, and kustomize operations to AI agents",
  repo = "github.com/hyperpolymath/poly-k8s-mcp",
  requires = ["kubernetes"],
  provides = ["kubectl", "helm", "kustomize"],
  config_schema = null,
  health_endpoint = null,
  metrics_endpoint = null,
  deployment_mode = "mcp-server",
  namespace = null,
  type = "mcp-server",
  source = "polystack/poly-k8s",
}

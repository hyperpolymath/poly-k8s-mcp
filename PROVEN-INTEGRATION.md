# Proven Library Integration Plan

This document outlines how the [proven](https://github.com/hyperpolymath/proven) library's formally verified modules can be integrated into poly-k8s-mcp.

## Applicable Modules

### High Priority

| Module | Use Case | Formal Guarantee |
|--------|----------|------------------|
| `SafeResource` | Pod/deployment lifecycle | Valid state transitions |
| `SafeCapability` | RBAC modeling | Kubernetes permissions |
| `SafeSchema` | Manifest validation | Type-safe K8s objects |

### Medium Priority

| Module | Use Case | Formal Guarantee |
|--------|----------|------------------|
| `SafeGraph` | Resource dependencies | Acyclic deployments |
| `SafeStateMachine` | Rollout states | Safe deployment strategies |
| `SafePolicy` | Network policies | Valid network rules |

## Integration Points

### 1. Resource Lifecycle (SafeResource)

```
Pod: :pending → :running → :succeeded | :failed
Deployment: :progressing → :available → :degraded
StatefulSet: :ordered_ready → :parallel
```

State transitions verified for all Kubernetes resource kinds.

### 2. RBAC Modeling (SafeCapability)

```
Role → SafeCapability.createCapability → scoped permissions
RoleBinding → SafeCapability.bind → subject-to-role mapping
```

Capabilities map to Kubernetes verbs:
- `get`, `list`, `watch` → ReadCapability
- `create`, `update`, `patch` → WriteCapability
- `delete` → DeleteCapability
- `*` → AdminCapability

### 3. Manifest Validation (SafeSchema)

```
manifest.yaml → SafeSchema.validateK8s → typed Resource
kubectl_apply → SafeSchema.checkMutation → valid changes
```

Validates against Kubernetes OpenAPI specs + custom CRDs.

## Kubernetes-Specific Integrations

| Resource | Lifecycle | proven Module |
|----------|-----------|---------------|
| Pod | Container states | SafeResource |
| Deployment | Rollout strategy | SafeStateMachine |
| Service | Endpoint selection | SafeGraph |
| NetworkPolicy | Ingress/egress | SafePolicy |
| RBAC | Permissions | SafeCapability |

## Deployment State Machine

```
:progressing → :available
      ↓              ↓
:stalled      :scaling
      ↓              ↓
:failed       :updating → :available
```

Rolling updates follow proven state transitions:
- `kubectl rollout restart`: available → updating → available
- `kubectl rollout undo`: updating → progressing → available
- `kubectl scale`: available → scaling → available

## Network Policy as SafePolicy

```
SafePolicy.Zone.Restricted: namespace isolation
SafePolicy.Zone.Mutable: inter-pod communication
SafePolicy.allowIngress(from: "frontend", to: "backend", port: 8080)
```

## Implementation Notes

All kubectl operations flow through proven's validators:

```
manifest → SafeSchema.validate → kubectl_apply → SafeResource.updateState
```

Invalid manifests are rejected before reaching the cluster.

## Status

- [ ] Add SafeResource for pod/deployment lifecycle
- [ ] Implement SafeCapability for RBAC modeling
- [ ] Integrate SafeSchema for manifest validation
- [ ] Add deployment rollout state machine

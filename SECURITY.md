# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### Contact

- **Email**: security@hyperpolymath.org
- **PGP Key**: https://hyperpolymath.org/gpg/security.asc

### Process

1. **Do not** open a public issue for security vulnerabilities
2. Email the security team with details of the vulnerability
3. Include steps to reproduce if possible
4. Allow up to 7 days for initial response

### What to Expect

- Acknowledgment within 7 days
- Regular updates on progress
- Credit in security advisories (if desired)
- Coordinated disclosure timeline

## Security Considerations

### Kubernetes Access

This MCP server executes kubectl, helm, and kustomize commands. It inherits the permissions of the configured kubeconfig. Ensure:

- Use least-privilege service accounts
- Configure RBAC appropriately
- Review commands before execution in production
- Use dry-run modes for verification

### Container Security

The official container image:

- Uses Chainguard wolfi-base (minimal attack surface)
- Runs as non-root user (UID 1000)
- Requires explicit Deno permissions
- Does not include unnecessary tools

### Best Practices

1. **Network Isolation**: Run in isolated networks where possible
2. **RBAC**: Use Kubernetes RBAC to limit MCP server permissions
3. **Audit Logging**: Enable Kubernetes audit logging
4. **Secret Management**: Never pass secrets as tool arguments in plaintext
5. **Review Manifests**: Always review manifests before applying

## Acknowledgments

We thank the security researchers who help keep this project secure:

https://hyperpolymath.org/security/acknowledgments

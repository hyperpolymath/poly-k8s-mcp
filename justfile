# SPDX-License-Identifier: PMPL-1.0-or-later
# Justfile for poly-k8s-mcp

default:
    @just --list

# Run panic-attack assail
assail:
    panic-attack assail .

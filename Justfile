# SPDX-License-Identifier: MPL-2.0
# Justfile for poly-k8s-mcp

default:
    @just --list

# Run panic-attack assail
assail:
    panic-attack assail .

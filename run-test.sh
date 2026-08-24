#!/bin/bash
# SPDX-License-Identifier: MPL-2.0
# Test script for poly-k8s-mcp

export ASDF_DENO_VERSION=1.45.0
export PATH="/home/hyper/.asdf/installs/deno/1.45.0/bin:$PATH"

cd /var/home/hyper/repos/poly-k8s-mcp

# Test with timeout
timeout 5 deno run --allow-read --allow-write --allow-net --allow-env bundle.js < mcp-input.bin 2>&1
echo "Exit code: $?"

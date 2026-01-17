#!/bin/bash
# SPDX-License-Identifier: MIT
# Test MCP initialize message

MSG='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
LEN=${#MSG}

printf "Content-Length: %d\r\n\r\n%s" "$LEN" "$MSG"

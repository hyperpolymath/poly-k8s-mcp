// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/// Deno runtime bindings for poly-k8s-mcp

module Env = {
  @scope(("Deno", "env")) @val
  external get: string => option<string> = "get"

  let getWithDefault = (key: string, default: string): string => {
    switch get(key) {
    | Some(v) => v
    | None => default
    }
  }
}

// File system operations
@scope("Deno") @val
external writeTextFile: (string, string) => promise<unit> = "writeTextFile"

@scope("Deno") @val
external readTextFile: (string) => promise<string> = "readTextFile"

module Command = {
  type t

  type commandOutput = {
    success: bool,
    code: int,
    stdout: Js.TypedArray2.Uint8Array.t,
    stderr: Js.TypedArray2.Uint8Array.t,
  }

  @new external textDecoder: unit => {"decode": Js.TypedArray2.Uint8Array.t => string} = "TextDecoder"

  let decoder = textDecoder()

  let stdoutText = (output: commandOutput): string => decoder["decode"](output.stdout)
  let stderrText = (output: commandOutput): string => decoder["decode"](output.stderr)

  // Internal binding for Deno.Command
  type commandInit = {
    args?: array<string>,
    cwd?: string,
    stdout?: string,
    stderr?: string,
  }

  @new @scope("Deno")
  external makeCommand: (string, commandInit) => t = "Command"

  @send external output: t => promise<commandOutput> = "output"

  // Public API with optional named parameters
  let new = (cmd: string, ~args: array<string>=[], ~cwd: string=""): t => {
    if cwd !== "" {
      makeCommand(cmd, {args, cwd, stdout: "piped", stderr: "piped"})
    } else {
      makeCommand(cmd, {args, stdout: "piped", stderr: "piped"})
    }
  }

  // Legacy run function for compatibility
  let run = async (binary: string, args: array<string>): (int, string, string) => {
    let cmd = new(binary, ~args)
    let result = await output(cmd)
    (result.code, stdoutText(result), stderrText(result))
  }
}

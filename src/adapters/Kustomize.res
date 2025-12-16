// Kustomize adapter for Kubernetes configuration management
// Provides tools for building and managing Kustomize overlays

open Deno

type toolDef = {
  name: string,
  description: string,
  inputSchema: JSON.t,
}

let runKustomize = async (args: array<string>): result<string, string> => {
  let cmd = Command.new("kustomize", ~args)
  let output = await Command.output(cmd)
  if output.success {
    Ok(Command.stdoutText(output))
  } else {
    Error(Command.stderrText(output))
  }
}

let runKubectl = async (args: array<string>): result<string, string> => {
  let cmd = Command.new("kubectl", ~args)
  let output = await Command.output(cmd)
  if output.success {
    Ok(Command.stdoutText(output))
  } else {
    Error(Command.stderrText(output))
  }
}

let tools: dict<toolDef> = Dict.fromArray([
  ("kustomize_build", {
    name: "kustomize_build",
    description: "Build a kustomization directory into YAML manifests",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path to kustomization directory" },
        "output": { "type": "string", "description": "Output file path (optional, stdout if not set)" },
        "enableHelm": { "type": "boolean", "description": "Enable Helm chart inflation" },
        "loadRestrictor": { "type": "string", "enum": ["LoadRestrictionsNone", "LoadRestrictionsRootOnly"], "description": "Load restriction policy" }
      },
      "required": ["path"]
    }`),
  }),
  ("kustomize_apply", {
    name: "kustomize_apply",
    description: "Build and apply kustomization to cluster (kubectl apply -k)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path to kustomization directory" },
        "namespace": { "type": "string", "description": "Target namespace" },
        "dryRun": { "type": "boolean", "description": "Run in dry-run mode" },
        "serverSide": { "type": "boolean", "description": "Use server-side apply" },
        "prune": { "type": "boolean", "description": "Prune resources not in manifest" }
      },
      "required": ["path"]
    }`),
  }),
  ("kustomize_create", {
    name: "kustomize_create",
    description: "Create a new kustomization.yaml file",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Directory for new kustomization" },
        "resources": { "type": "array", "items": { "type": "string" }, "description": "Resource files to include" },
        "namespace": { "type": "string", "description": "Namespace to set" },
        "namePrefix": { "type": "string", "description": "Prefix for all resource names" },
        "nameSuffix": { "type": "string", "description": "Suffix for all resource names" }
      },
      "required": ["path"]
    }`),
  }),
  ("kustomize_edit_add", {
    name: "kustomize_edit_add",
    description: "Add items to kustomization (resource, patch, configmap, secret, etc.)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path to kustomization directory" },
        "type": { "type": "string", "enum": ["resource", "patch", "configmap", "secret", "base", "label", "annotation"], "description": "What to add" },
        "name": { "type": "string", "description": "Name (for configmap/secret)" },
        "file": { "type": "string", "description": "File path to add" },
        "literal": { "type": "string", "description": "Literal value (key=value)" }
      },
      "required": ["path", "type"]
    }`),
  }),
  ("kustomize_edit_set", {
    name: "kustomize_edit_set",
    description: "Set values in kustomization (namespace, nameprefix, namesuffix, image)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path to kustomization directory" },
        "type": { "type": "string", "enum": ["namespace", "nameprefix", "namesuffix", "image"], "description": "What to set" },
        "value": { "type": "string", "description": "Value to set" },
        "newName": { "type": "string", "description": "New image name (for image type)" },
        "newTag": { "type": "string", "description": "New image tag (for image type)" },
        "digest": { "type": "string", "description": "Image digest (for image type)" }
      },
      "required": ["path", "type", "value"]
    }`),
  }),
  ("kustomize_edit_remove", {
    name: "kustomize_edit_remove",
    description: "Remove items from kustomization",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "path": { "type": "string", "description": "Path to kustomization directory" },
        "type": { "type": "string", "enum": ["resource", "patch", "transformer", "buildmetadata"], "description": "What to remove" },
        "file": { "type": "string", "description": "File path to remove" }
      },
      "required": ["path", "type", "file"]
    }`),
  }),
  ("kustomize_cfg", {
    name: "kustomize_cfg",
    description: "Run kustomize cfg commands (cat, count, grep, tree)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "command": { "type": "string", "enum": ["cat", "count", "grep", "tree"], "description": "cfg subcommand" },
        "path": { "type": "string", "description": "Path to resources" },
        "pattern": { "type": "string", "description": "Pattern for grep" }
      },
      "required": ["command", "path"]
    }`),
  }),
  ("kustomize_version", {
    name: "kustomize_version",
    description: "Show kustomize version",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {}
    }`),
  }),
])

let handleToolCall = async (name: string, args: JSON.t): result<string, string> => {
  let argsDict = args->JSON.Decode.object->Option.getOr(Dict.make())
  let getString = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.string)->Option.getOr("")
  let getBool = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.bool)->Option.getOr(false)
  let getArray = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.array)->Option.getOr([])

  switch name {
  | "kustomize_build" => {
      let path = getString("path")
      let output = getString("output")
      let enableHelm = getBool("enableHelm")
      let loadRestrictor = getString("loadRestrictor")

      let args = ["build", path]
      let args = enableHelm ? Array.concat(args, ["--enable-helm"]) : args
      let args = loadRestrictor !== "" ? Array.concat(args, ["--load-restrictor", loadRestrictor]) : args
      let args = output !== "" ? Array.concat(args, ["-o", output]) : args
      await runKustomize(args)
    }
  | "kustomize_apply" => {
      let path = getString("path")
      let ns = getString("namespace")
      let dryRun = getBool("dryRun")
      let serverSide = getBool("serverSide")
      let prune = getBool("prune")

      let args = ["apply", "-k", path]
      let args = ns !== "" ? Array.concat(args, ["-n", ns]) : args
      let args = dryRun ? Array.concat(args, ["--dry-run=client"]) : args
      let args = serverSide ? Array.concat(args, ["--server-side"]) : args
      let args = prune ? Array.concat(args, ["--prune"]) : args
      await runKubectl(args)
    }
  | "kustomize_create" => {
      let path = getString("path")
      let resources = getArray("resources")->Array.filterMap(JSON.Decode.string)
      let ns = getString("namespace")
      let namePrefix = getString("namePrefix")
      let nameSuffix = getString("nameSuffix")

      // kustomize create doesn't exist as a command, we'll generate the file
      let kustomization = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
${ns !== "" ? "namespace: " ++ ns ++ "\n" : ""}${namePrefix !== "" ? "namePrefix: " ++ namePrefix ++ "\n" : ""}${nameSuffix !== "" ? "nameSuffix: " ++ nameSuffix ++ "\n" : ""}resources:
${resources->Array.map(r => "  - " ++ r)->Array.join("\n")}
`
      let filePath = path ++ "/kustomization.yaml"
      await Deno.writeTextFile(filePath, kustomization)
      Ok("Created " ++ filePath)
    }
  | "kustomize_edit_add" => {
      let path = getString("path")
      let addType = getString("type")
      let addName = getString("name")
      let file = getString("file")
      let literal = getString("literal")

      let args = ["edit", "add", addType]
      let args = switch addType {
      | "configmap" | "secret" => {
          let args = Array.concat(args, [addName])
          let args = file !== "" ? Array.concat(args, ["--from-file=" ++ file]) : args
          let args = literal !== "" ? Array.concat(args, ["--from-literal=" ++ literal]) : args
          args
        }
      | "resource" | "patch" | "base" => Array.concat(args, [file])
      | "label" | "annotation" => Array.concat(args, [literal])
      | _ => args
      }

      let cmd = Command.new("kustomize", ~args, ~cwd=path)
      let output = await Command.output(cmd)
      if output.success {
        Ok(Command.stdoutText(output))
      } else {
        Error(Command.stderrText(output))
      }
    }
  | "kustomize_edit_set" => {
      let path = getString("path")
      let setType = getString("type")
      let value = getString("value")
      let newName = getString("newName")
      let newTag = getString("newTag")
      let digest = getString("digest")

      let args = switch setType {
      | "image" => {
          let imgArg = if newName !== "" && newTag !== "" {
            `${value}=${newName}:${newTag}`
          } else if newTag !== "" {
            `${value}:${newTag}`
          } else if digest !== "" {
            `${value}@${digest}`
          } else {
            value
          }
          ["edit", "set", "image", imgArg]
        }
      | _ => ["edit", "set", setType, value]
      }

      let cmd = Command.new("kustomize", ~args, ~cwd=path)
      let output = await Command.output(cmd)
      if output.success {
        Ok(Command.stdoutText(output))
      } else {
        Error(Command.stderrText(output))
      }
    }
  | "kustomize_edit_remove" => {
      let path = getString("path")
      let removeType = getString("type")
      let file = getString("file")

      let cmd = Command.new("kustomize", ~args=["edit", "remove", removeType, file], ~cwd=path)
      let output = await Command.output(cmd)
      if output.success {
        Ok(Command.stdoutText(output))
      } else {
        Error(Command.stderrText(output))
      }
    }
  | "kustomize_cfg" => {
      let command = getString("command")
      let path = getString("path")
      let pattern = getString("pattern")

      let args = ["cfg", command, path]
      let args = pattern !== "" && command === "grep" ? Array.concat(args, [pattern]) : args
      await runKustomize(args)
    }
  | "kustomize_version" => await runKustomize(["version"])
  | _ => Error("Unknown tool: " ++ name)
  }
}

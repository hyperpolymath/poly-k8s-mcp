// Kubectl adapter for Kubernetes cluster management
// Provides tools for managing pods, deployments, services, and more

open Deno

type toolDef = {
  name: string,
  description: string,
  inputSchema: JSON.t,
}

let namespace = ref("default")

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
  ("kubectl_get", {
    name: "kubectl_get",
    description: "Get Kubernetes resources (pods, deployments, services, etc.)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource type (pods, deployments, services, configmaps, secrets, nodes, namespaces, etc.)" },
        "name": { "type": "string", "description": "Optional resource name" },
        "namespace": { "type": "string", "description": "Namespace (default: current)" },
        "selector": { "type": "string", "description": "Label selector (e.g., app=nginx)" },
        "output": { "type": "string", "enum": ["wide", "yaml", "json", "name"], "description": "Output format" },
        "allNamespaces": { "type": "boolean", "description": "List across all namespaces" }
      },
      "required": ["resource"]
    }`),
  }),
  ("kubectl_describe", {
    name: "kubectl_describe",
    description: "Show detailed information about a Kubernetes resource",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource type" },
        "name": { "type": "string", "description": "Resource name" },
        "namespace": { "type": "string", "description": "Namespace" }
      },
      "required": ["resource", "name"]
    }`),
  }),
  ("kubectl_logs", {
    name: "kubectl_logs",
    description: "Print logs from a container in a pod",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "pod": { "type": "string", "description": "Pod name" },
        "container": { "type": "string", "description": "Container name (if multiple)" },
        "namespace": { "type": "string", "description": "Namespace" },
        "tail": { "type": "integer", "description": "Number of lines from end" },
        "since": { "type": "string", "description": "Only logs newer than duration (e.g., 5m, 1h)" },
        "follow": { "type": "boolean", "description": "Stream logs (returns snapshot)" },
        "previous": { "type": "boolean", "description": "Print previous instance logs" }
      },
      "required": ["pod"]
    }`),
  }),
  ("kubectl_apply", {
    name: "kubectl_apply",
    description: "Apply a configuration to a resource from a file or stdin",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "manifest": { "type": "string", "description": "YAML or JSON manifest content" },
        "filename": { "type": "string", "description": "Path to manifest file" },
        "namespace": { "type": "string", "description": "Namespace" },
        "dryRun": { "type": "boolean", "description": "Run in dry-run mode (client or server)" }
      }
    }`),
  }),
  ("kubectl_delete", {
    name: "kubectl_delete",
    description: "Delete Kubernetes resources",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource type" },
        "name": { "type": "string", "description": "Resource name" },
        "namespace": { "type": "string", "description": "Namespace" },
        "selector": { "type": "string", "description": "Label selector" },
        "force": { "type": "boolean", "description": "Force deletion" },
        "gracePeriod": { "type": "integer", "description": "Grace period in seconds" }
      },
      "required": ["resource"]
    }`),
  }),
  ("kubectl_exec", {
    name: "kubectl_exec",
    description: "Execute a command in a container",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "pod": { "type": "string", "description": "Pod name" },
        "command": { "type": "string", "description": "Command to execute" },
        "container": { "type": "string", "description": "Container name" },
        "namespace": { "type": "string", "description": "Namespace" }
      },
      "required": ["pod", "command"]
    }`),
  }),
  ("kubectl_scale", {
    name: "kubectl_scale",
    description: "Scale a deployment, replicaset, or statefulset",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource type (deployment, replicaset, statefulset)" },
        "name": { "type": "string", "description": "Resource name" },
        "replicas": { "type": "integer", "description": "Number of replicas" },
        "namespace": { "type": "string", "description": "Namespace" }
      },
      "required": ["resource", "name", "replicas"]
    }`),
  }),
  ("kubectl_rollout", {
    name: "kubectl_rollout",
    description: "Manage rollouts (status, history, undo, restart)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["status", "history", "undo", "restart", "pause", "resume"], "description": "Rollout action" },
        "resource": { "type": "string", "description": "Resource type (deployment, daemonset, statefulset)" },
        "name": { "type": "string", "description": "Resource name" },
        "namespace": { "type": "string", "description": "Namespace" },
        "revision": { "type": "integer", "description": "Revision number for undo" }
      },
      "required": ["action", "resource", "name"]
    }`),
  }),
  ("kubectl_port_forward", {
    name: "kubectl_port_forward",
    description: "Forward local port to a pod (returns connection info)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource (pod/name or svc/name)" },
        "ports": { "type": "string", "description": "Port mapping (local:remote)" },
        "namespace": { "type": "string", "description": "Namespace" }
      },
      "required": ["resource", "ports"]
    }`),
  }),
  ("kubectl_context", {
    name: "kubectl_context",
    description: "Manage kubectl contexts (list, current, use)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "action": { "type": "string", "enum": ["list", "current", "use"], "description": "Context action" },
        "name": { "type": "string", "description": "Context name for 'use' action" }
      },
      "required": ["action"]
    }`),
  }),
  ("kubectl_top", {
    name: "kubectl_top",
    description: "Display resource usage (CPU/memory) for nodes or pods",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "enum": ["nodes", "pods"], "description": "Resource type" },
        "name": { "type": "string", "description": "Optional resource name" },
        "namespace": { "type": "string", "description": "Namespace for pods" },
        "containers": { "type": "boolean", "description": "Show container metrics" }
      },
      "required": ["resource"]
    }`),
  }),
  ("kubectl_create", {
    name: "kubectl_create",
    description: "Create resources (namespace, secret, configmap, etc.)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "resource": { "type": "string", "description": "Resource type to create" },
        "name": { "type": "string", "description": "Resource name" },
        "namespace": { "type": "string", "description": "Namespace" },
        "fromLiteral": { "type": "object", "description": "Key-value pairs for configmap/secret" },
        "fromFile": { "type": "string", "description": "File path for configmap/secret" }
      },
      "required": ["resource", "name"]
    }`),
  }),
])

let handleToolCall = async (name: string, args: JSON.t): result<string, string> => {
  let argsDict = args->JSON.Decode.object->Option.getOr(Dict.make())
  let getString = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.string)->Option.getOr("")
  let getBool = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.bool)->Option.getOr(false)
  let getInt = key => argsDict->Dict.get(key)->Option.flatMap(JSON.Decode.float)->Option.map(v => Int.fromFloat(v))
  let ns = getString("namespace")
  let nsArg = ns !== "" ? ["-n", ns] : []

  switch name {
  | "kubectl_get" => {
      let resource = getString("resource")
      let resName = getString("name")
      let selector = getString("selector")
      let output = getString("output")
      let allNs = getBool("allNamespaces")

      let args = ["get", resource]
      let args = resName !== "" ? Array.concat(args, [resName]) : args
      let args = allNs ? Array.concat(args, ["--all-namespaces"]) : Array.concat(args, nsArg)
      let args = selector !== "" ? Array.concat(args, ["-l", selector]) : args
      let args = output !== "" ? Array.concat(args, ["-o", output]) : args
      await runKubectl(args)
    }
  | "kubectl_describe" => {
      let resource = getString("resource")
      let resName = getString("name")
      await runKubectl(Array.concat(["describe", resource, resName], nsArg))
    }
  | "kubectl_logs" => {
      let pod = getString("pod")
      let container = getString("container")
      let since = getString("since")
      let tail = getInt("tail")
      let previous = getBool("previous")

      let args = ["logs", pod]
      let args = Array.concat(args, nsArg)
      let args = container !== "" ? Array.concat(args, ["-c", container]) : args
      let args = since !== "" ? Array.concat(args, ["--since", since]) : args
      let args = switch tail { | Some(n) => Array.concat(args, ["--tail", Int.toString(n)]) | None => args }
      let args = previous ? Array.concat(args, ["--previous"]) : args
      await runKubectl(args)
    }
  | "kubectl_apply" => {
      let manifest = getString("manifest")
      let filename = getString("filename")
      let dryRun = getBool("dryRun")

      let args = ["apply"]
      let args = Array.concat(args, nsArg)
      let args = dryRun ? Array.concat(args, ["--dry-run=client"]) : args
      let args = filename !== "" ? Array.concat(args, ["-f", filename]) : Array.concat(args, ["-f", "-"])

      if filename !== "" {
        await runKubectl(args)
      } else {
        // Write manifest to unique temp file and apply (secure random suffix)
        let randomSuffix = Int.toString(Int.fromFloat(Math.random() *. 1000000000.0))
        let tmpFile = `/tmp/kubectl-manifest-${randomSuffix}.yaml`
        await Deno.writeTextFile(tmpFile, manifest)
        let result = await runKubectl(Array.concat(args->Array.filter(a => a !== "-"), ["-f", tmpFile]))
        result
      }
    }
  | "kubectl_delete" => {
      let resource = getString("resource")
      let resName = getString("name")
      let selector = getString("selector")
      let force = getBool("force")
      let gracePeriod = getInt("gracePeriod")

      let args = ["delete", resource]
      let args = resName !== "" ? Array.concat(args, [resName]) : args
      let args = Array.concat(args, nsArg)
      let args = selector !== "" ? Array.concat(args, ["-l", selector]) : args
      let args = force ? Array.concat(args, ["--force"]) : args
      let args = switch gracePeriod { | Some(n) => Array.concat(args, ["--grace-period", Int.toString(n)]) | None => args }
      await runKubectl(args)
    }
  | "kubectl_exec" => {
      let pod = getString("pod")
      let command = getString("command")
      let container = getString("container")

      let args = ["exec", pod]
      let args = Array.concat(args, nsArg)
      let args = container !== "" ? Array.concat(args, ["-c", container]) : args
      let args = Array.concat(args, ["--", "sh", "-c", command])
      await runKubectl(args)
    }
  | "kubectl_scale" => {
      let resource = getString("resource")
      let resName = getString("name")
      let replicas = getInt("replicas")->Option.getOr(1)

      await runKubectl(Array.concat(["scale", `${resource}/${resName}`, `--replicas=${Int.toString(replicas)}`], nsArg))
    }
  | "kubectl_rollout" => {
      let action = getString("action")
      let resource = getString("resource")
      let resName = getString("name")
      let revision = getInt("revision")

      let args = ["rollout", action, `${resource}/${resName}`]
      let args = Array.concat(args, nsArg)
      let args = switch revision { | Some(n) => Array.concat(args, [`--to-revision=${Int.toString(n)}`]) | None => args }
      await runKubectl(args)
    }
  | "kubectl_port_forward" => {
      let resource = getString("resource")
      let ports = getString("ports")
      Ok(`Port forward: kubectl port-forward ${resource} ${ports} ${ns !== "" ? "-n " ++ ns : ""}\nNote: Run this command manually as it requires an interactive session.`)
    }
  | "kubectl_context" => {
      let action = getString("action")
      let ctxName = getString("name")
      switch action {
      | "list" => await runKubectl(["config", "get-contexts"])
      | "current" => await runKubectl(["config", "current-context"])
      | "use" => await runKubectl(["config", "use-context", ctxName])
      | _ => Error("Unknown action: " ++ action)
      }
    }
  | "kubectl_top" => {
      let resource = getString("resource")
      let resName = getString("name")
      let containers = getBool("containers")

      let args = ["top", resource]
      let args = resName !== "" ? Array.concat(args, [resName]) : args
      let args = resource === "pods" ? Array.concat(args, nsArg) : args
      let args = containers ? Array.concat(args, ["--containers"]) : args
      await runKubectl(args)
    }
  | "kubectl_create" => {
      let resource = getString("resource")
      let resName = getString("name")

      let args = ["create", resource, resName]
      let args = Array.concat(args, nsArg)
      await runKubectl(args)
    }
  | _ => Error("Unknown tool: " ++ name)
  }
}

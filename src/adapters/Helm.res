// Helm adapter for Kubernetes package management
// Provides tools for managing Helm charts, releases, and repositories

open Deno

type toolDef = {
  name: string,
  description: string,
  inputSchema: JSON.t,
}

let runHelm = async (args: array<string>): result<string, string> => {
  let cmd = Command.new("helm", ~args)
  let output = await Command.output(cmd)
  if output.success {
    Ok(Command.stdoutText(output))
  } else {
    Error(Command.stderrText(output))
  }
}

let tools: dict<toolDef> = Dict.fromArray([
  ("helm_install", {
    name: "helm_install",
    description: "Install a Helm chart",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "chart": { "type": "string", "description": "Chart reference (repo/chart or path)" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "values": { "type": "object", "description": "Values to override (key-value pairs)" },
        "valuesFile": { "type": "string", "description": "Path to values file" },
        "version": { "type": "string", "description": "Chart version" },
        "createNamespace": { "type": "boolean", "description": "Create namespace if not exists" },
        "dryRun": { "type": "boolean", "description": "Simulate installation" },
        "wait": { "type": "boolean", "description": "Wait for resources to be ready" }
      },
      "required": ["name", "chart"]
    }`),
  }),
  ("helm_upgrade", {
    name: "helm_upgrade",
    description: "Upgrade a Helm release",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "chart": { "type": "string", "description": "Chart reference" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "values": { "type": "object", "description": "Values to override" },
        "valuesFile": { "type": "string", "description": "Path to values file" },
        "version": { "type": "string", "description": "Chart version" },
        "install": { "type": "boolean", "description": "Install if release doesn't exist" },
        "dryRun": { "type": "boolean", "description": "Simulate upgrade" },
        "wait": { "type": "boolean", "description": "Wait for resources to be ready" },
        "reuseValues": { "type": "boolean", "description": "Reuse existing values" }
      },
      "required": ["name", "chart"]
    }`),
  }),
  ("helm_uninstall", {
    name: "helm_uninstall",
    description: "Uninstall a Helm release",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "keepHistory": { "type": "boolean", "description": "Keep release history" },
        "dryRun": { "type": "boolean", "description": "Simulate uninstall" }
      },
      "required": ["name"]
    }`),
  }),
  ("helm_list", {
    name: "helm_list",
    description: "List Helm releases",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "allNamespaces": { "type": "boolean", "description": "List across all namespaces" },
        "filter": { "type": "string", "description": "Filter by release name regex" },
        "deployed": { "type": "boolean", "description": "Show deployed releases only" },
        "failed": { "type": "boolean", "description": "Show failed releases only" },
        "pending": { "type": "boolean", "description": "Show pending releases only" }
      }
    }`),
  }),
  ("helm_status", {
    name: "helm_status",
    description: "Get status of a Helm release",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "revision": { "type": "integer", "description": "Specific revision" }
      },
      "required": ["name"]
    }`),
  }),
  ("helm_history", {
    name: "helm_history",
    description: "Get release history",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "max": { "type": "integer", "description": "Maximum revisions to show" }
      },
      "required": ["name"]
    }`),
  }),
  ("helm_rollback", {
    name: "helm_rollback",
    description: "Rollback a release to a previous revision",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "revision": { "type": "integer", "description": "Revision number to rollback to" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "dryRun": { "type": "boolean", "description": "Simulate rollback" },
        "wait": { "type": "boolean", "description": "Wait for resources to be ready" }
      },
      "required": ["name", "revision"]
    }`),
  }),
  ("helm_repo_add", {
    name: "helm_repo_add",
    description: "Add a Helm chart repository",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Repository name" },
        "url": { "type": "string", "description": "Repository URL" },
        "username": { "type": "string", "description": "Username for auth" },
        "password": { "type": "string", "description": "Password for auth" },
        "forceUpdate": { "type": "boolean", "description": "Replace existing repo" }
      },
      "required": ["name", "url"]
    }`),
  }),
  ("helm_repo_list", {
    name: "helm_repo_list",
    description: "List configured Helm repositories",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {}
    }`),
  }),
  ("helm_repo_update", {
    name: "helm_repo_update",
    description: "Update Helm repository cache",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "repos": { "type": "array", "items": { "type": "string" }, "description": "Specific repos to update" }
      }
    }`),
  }),
  ("helm_search", {
    name: "helm_search",
    description: "Search for Helm charts",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "keyword": { "type": "string", "description": "Search keyword" },
        "source": { "type": "string", "enum": ["repo", "hub"], "description": "Search repos or Artifact Hub" },
        "version": { "type": "string", "description": "Version constraint" },
        "versions": { "type": "boolean", "description": "Show all versions" }
      },
      "required": ["keyword"]
    }`),
  }),
  ("helm_show", {
    name: "helm_show",
    description: "Show chart information (values, readme, chart)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "chart": { "type": "string", "description": "Chart reference" },
        "info": { "type": "string", "enum": ["all", "chart", "readme", "values", "crds"], "description": "What to show" },
        "version": { "type": "string", "description": "Chart version" }
      },
      "required": ["chart"]
    }`),
  }),
  ("helm_template", {
    name: "helm_template",
    description: "Render chart templates locally",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "chart": { "type": "string", "description": "Chart reference" },
        "values": { "type": "object", "description": "Values to override" },
        "valuesFile": { "type": "string", "description": "Path to values file" },
        "version": { "type": "string", "description": "Chart version" },
        "namespace": { "type": "string", "description": "Namespace for resources" }
      },
      "required": ["name", "chart"]
    }`),
  }),
  ("helm_get", {
    name: "helm_get",
    description: "Get release information (values, manifest, notes, hooks)",
    inputSchema: %raw(`{
      "type": "object",
      "properties": {
        "name": { "type": "string", "description": "Release name" },
        "info": { "type": "string", "enum": ["all", "values", "manifest", "notes", "hooks"], "description": "What to get" },
        "namespace": { "type": "string", "description": "Kubernetes namespace" },
        "revision": { "type": "integer", "description": "Specific revision" }
      },
      "required": ["name"]
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
  | "helm_install" => {
      let relName = getString("name")
      let chart = getString("chart")
      let version = getString("version")
      let valuesFile = getString("valuesFile")
      let createNs = getBool("createNamespace")
      let dryRun = getBool("dryRun")
      let wait = getBool("wait")

      let args = ["install", relName, chart]
      let args = Array.concat(args, nsArg)
      let args = version !== "" ? Array.concat(args, ["--version", version]) : args
      let args = valuesFile !== "" ? Array.concat(args, ["-f", valuesFile]) : args
      let args = createNs ? Array.concat(args, ["--create-namespace"]) : args
      let args = dryRun ? Array.concat(args, ["--dry-run"]) : args
      let args = wait ? Array.concat(args, ["--wait"]) : args
      await runHelm(args)
    }
  | "helm_upgrade" => {
      let relName = getString("name")
      let chart = getString("chart")
      let version = getString("version")
      let valuesFile = getString("valuesFile")
      let install = getBool("install")
      let dryRun = getBool("dryRun")
      let wait = getBool("wait")
      let reuseValues = getBool("reuseValues")

      let args = ["upgrade", relName, chart]
      let args = Array.concat(args, nsArg)
      let args = version !== "" ? Array.concat(args, ["--version", version]) : args
      let args = valuesFile !== "" ? Array.concat(args, ["-f", valuesFile]) : args
      let args = install ? Array.concat(args, ["--install"]) : args
      let args = dryRun ? Array.concat(args, ["--dry-run"]) : args
      let args = wait ? Array.concat(args, ["--wait"]) : args
      let args = reuseValues ? Array.concat(args, ["--reuse-values"]) : args
      await runHelm(args)
    }
  | "helm_uninstall" => {
      let relName = getString("name")
      let keepHistory = getBool("keepHistory")
      let dryRun = getBool("dryRun")

      let args = ["uninstall", relName]
      let args = Array.concat(args, nsArg)
      let args = keepHistory ? Array.concat(args, ["--keep-history"]) : args
      let args = dryRun ? Array.concat(args, ["--dry-run"]) : args
      await runHelm(args)
    }
  | "helm_list" => {
      let allNs = getBool("allNamespaces")
      let filter = getString("filter")
      let deployed = getBool("deployed")
      let failed = getBool("failed")
      let pending = getBool("pending")

      let args = ["list"]
      let args = allNs ? Array.concat(args, ["--all-namespaces"]) : Array.concat(args, nsArg)
      let args = filter !== "" ? Array.concat(args, ["--filter", filter]) : args
      let args = deployed ? Array.concat(args, ["--deployed"]) : args
      let args = failed ? Array.concat(args, ["--failed"]) : args
      let args = pending ? Array.concat(args, ["--pending"]) : args
      await runHelm(args)
    }
  | "helm_status" => {
      let relName = getString("name")
      let revision = getInt("revision")

      let args = ["status", relName]
      let args = Array.concat(args, nsArg)
      let args = switch revision { | Some(n) => Array.concat(args, ["--revision", Int.toString(n)]) | None => args }
      await runHelm(args)
    }
  | "helm_history" => {
      let relName = getString("name")
      let max = getInt("max")

      let args = ["history", relName]
      let args = Array.concat(args, nsArg)
      let args = switch max { | Some(n) => Array.concat(args, ["--max", Int.toString(n)]) | None => args }
      await runHelm(args)
    }
  | "helm_rollback" => {
      let relName = getString("name")
      let revision = getInt("revision")->Option.getOr(0)
      let dryRun = getBool("dryRun")
      let wait = getBool("wait")

      let args = ["rollback", relName, Int.toString(revision)]
      let args = Array.concat(args, nsArg)
      let args = dryRun ? Array.concat(args, ["--dry-run"]) : args
      let args = wait ? Array.concat(args, ["--wait"]) : args
      await runHelm(args)
    }
  | "helm_repo_add" => {
      let repoName = getString("name")
      let url = getString("url")
      let username = getString("username")
      let password = getString("password")
      let forceUpdate = getBool("forceUpdate")

      let args = ["repo", "add", repoName, url]
      let args = username !== "" ? Array.concat(args, ["--username", username]) : args
      let args = password !== "" ? Array.concat(args, ["--password", password]) : args
      let args = forceUpdate ? Array.concat(args, ["--force-update"]) : args
      await runHelm(args)
    }
  | "helm_repo_list" => await runHelm(["repo", "list"])
  | "helm_repo_update" => await runHelm(["repo", "update"])
  | "helm_search" => {
      let keyword = getString("keyword")
      let source = getString("source")
      let version = getString("version")
      let versions = getBool("versions")

      let searchCmd = source === "hub" ? "hub" : "repo"
      let args = ["search", searchCmd, keyword]
      let args = version !== "" ? Array.concat(args, ["--version", version]) : args
      let args = versions ? Array.concat(args, ["--versions"]) : args
      await runHelm(args)
    }
  | "helm_show" => {
      let chart = getString("chart")
      let info = getString("info")
      let version = getString("version")

      let showCmd = info !== "" ? info : "all"
      let args = ["show", showCmd, chart]
      let args = version !== "" ? Array.concat(args, ["--version", version]) : args
      await runHelm(args)
    }
  | "helm_template" => {
      let relName = getString("name")
      let chart = getString("chart")
      let version = getString("version")
      let valuesFile = getString("valuesFile")

      let args = ["template", relName, chart]
      let args = Array.concat(args, nsArg)
      let args = version !== "" ? Array.concat(args, ["--version", version]) : args
      let args = valuesFile !== "" ? Array.concat(args, ["-f", valuesFile]) : args
      await runHelm(args)
    }
  | "helm_get" => {
      let relName = getString("name")
      let info = getString("info")
      let revision = getInt("revision")

      let getCmd = info !== "" ? info : "all"
      let args = ["get", getCmd, relName]
      let args = Array.concat(args, nsArg)
      let args = switch revision { | Some(n) => Array.concat(args, ["--revision", Int.toString(n)]) | None => args }
      await runHelm(args)
    }
  | _ => Error("Unknown tool: " ++ name)
  }
}

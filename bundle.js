#!/usr/bin/env -S deno run --allow-run --allow-read --allow-env --allow-write

// lib/es6/src/bindings/Deno.res.js
var decoder = new TextDecoder();
function stdoutText(output) {
  return decoder.decode(output.stdout);
}
function stderrText(output) {
  return decoder.decode(output.stderr);
}
function $$new(cmd, argsOpt, cwdOpt) {
  let args = argsOpt !== void 0 ? argsOpt : [];
  let cwd = cwdOpt !== void 0 ? cwdOpt : "";
  if (cwd !== "") {
    return new Deno.Command(cmd, {
      args,
      cwd,
      stdout: "piped",
      stderr: "piped"
    });
  } else {
    return new Deno.Command(cmd, {
      args,
      stdout: "piped",
      stderr: "piped"
    });
  }
}
async function run(binary, args) {
  let cmd = $$new(binary, args, void 0);
  let result = await cmd.output();
  return [
    result.code,
    decoder.decode(result.stdout),
    decoder.decode(result.stderr)
  ];
}
var Command = {
  decoder,
  stdoutText,
  stderrText,
  $$new,
  run
};

// node_modules/@rescript/runtime/lib/es6/Stdlib_JSON.js
function bool(json) {
  if (typeof json === "boolean") {
    return json;
  }
}
function $$null(json) {
  if (json === null) {
    return null;
  }
}
function string(json) {
  if (typeof json === "string") {
    return json;
  }
}
function float(json) {
  if (typeof json === "number") {
    return json;
  }
}
function object(json) {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json;
  }
}
function array(json) {
  if (Array.isArray(json)) {
    return json;
  }
}
var Decode = {
  bool,
  $$null,
  string,
  float,
  object,
  array
};

// node_modules/@rescript/runtime/lib/es6/Primitive_option.js
function some(x) {
  if (x === void 0) {
    return {
      BS_PRIVATE_NESTED_SOME_NONE: 0
    };
  } else if (x !== null && x.BS_PRIVATE_NESTED_SOME_NONE !== void 0) {
    return {
      BS_PRIVATE_NESTED_SOME_NONE: x.BS_PRIVATE_NESTED_SOME_NONE + 1 | 0
    };
  } else {
    return x;
  }
}
function valFromOption(x) {
  if (x === null || x.BS_PRIVATE_NESTED_SOME_NONE === void 0) {
    return x;
  }
  let depth = x.BS_PRIVATE_NESTED_SOME_NONE;
  if (depth === 0) {
    return;
  } else {
    return {
      BS_PRIVATE_NESTED_SOME_NONE: depth - 1 | 0
    };
  }
}

// node_modules/@rescript/runtime/lib/es6/Stdlib_Option.js
function map(opt, f) {
  if (opt !== void 0) {
    return some(f(valFromOption(opt)));
  }
}
function flatMap(opt, f) {
  if (opt !== void 0) {
    return f(valFromOption(opt));
  }
}
function getOr(opt, $$default) {
  if (opt !== void 0) {
    return valFromOption(opt);
  } else {
    return $$default;
  }
}

// lib/es6/src/adapters/Kubectl.res.js
async function runKubectl(args) {
  let cmd = Command.$$new("kubectl", args, void 0);
  let output = await cmd.output();
  if (output.success) {
    return {
      TAG: "Ok",
      _0: Command.stdoutText(output)
    };
  } else {
    return {
      TAG: "Error",
      _0: Command.stderrText(output)
    };
  }
}
var tools = Object.fromEntries([
  [
    "kubectl_get",
    {
      name: "kubectl_get",
      description: "Get Kubernetes resources (pods, deployments, services, etc.)",
      inputSchema: {
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
      }
    }
  ],
  [
    "kubectl_describe",
    {
      name: "kubectl_describe",
      description: "Show detailed information about a Kubernetes resource",
      inputSchema: {
        "type": "object",
        "properties": {
          "resource": { "type": "string", "description": "Resource type" },
          "name": { "type": "string", "description": "Resource name" },
          "namespace": { "type": "string", "description": "Namespace" }
        },
        "required": ["resource", "name"]
      }
    }
  ],
  [
    "kubectl_logs",
    {
      name: "kubectl_logs",
      description: "Print logs from a container in a pod",
      inputSchema: {
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
      }
    }
  ],
  [
    "kubectl_apply",
    {
      name: "kubectl_apply",
      description: "Apply a configuration to a resource from a file or stdin",
      inputSchema: {
        "type": "object",
        "properties": {
          "manifest": { "type": "string", "description": "YAML or JSON manifest content" },
          "filename": { "type": "string", "description": "Path to manifest file" },
          "namespace": { "type": "string", "description": "Namespace" },
          "dryRun": { "type": "boolean", "description": "Run in dry-run mode (client or server)" }
        }
      }
    }
  ],
  [
    "kubectl_delete",
    {
      name: "kubectl_delete",
      description: "Delete Kubernetes resources",
      inputSchema: {
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
      }
    }
  ],
  [
    "kubectl_exec",
    {
      name: "kubectl_exec",
      description: "Execute a command in a container",
      inputSchema: {
        "type": "object",
        "properties": {
          "pod": { "type": "string", "description": "Pod name" },
          "command": { "type": "string", "description": "Command to execute" },
          "container": { "type": "string", "description": "Container name" },
          "namespace": { "type": "string", "description": "Namespace" }
        },
        "required": ["pod", "command"]
      }
    }
  ],
  [
    "kubectl_scale",
    {
      name: "kubectl_scale",
      description: "Scale a deployment, replicaset, or statefulset",
      inputSchema: {
        "type": "object",
        "properties": {
          "resource": { "type": "string", "description": "Resource type (deployment, replicaset, statefulset)" },
          "name": { "type": "string", "description": "Resource name" },
          "replicas": { "type": "integer", "description": "Number of replicas" },
          "namespace": { "type": "string", "description": "Namespace" }
        },
        "required": ["resource", "name", "replicas"]
      }
    }
  ],
  [
    "kubectl_rollout",
    {
      name: "kubectl_rollout",
      description: "Manage rollouts (status, history, undo, restart)",
      inputSchema: {
        "type": "object",
        "properties": {
          "action": { "type": "string", "enum": ["status", "history", "undo", "restart", "pause", "resume"], "description": "Rollout action" },
          "resource": { "type": "string", "description": "Resource type (deployment, daemonset, statefulset)" },
          "name": { "type": "string", "description": "Resource name" },
          "namespace": { "type": "string", "description": "Namespace" },
          "revision": { "type": "integer", "description": "Revision number for undo" }
        },
        "required": ["action", "resource", "name"]
      }
    }
  ],
  [
    "kubectl_port_forward",
    {
      name: "kubectl_port_forward",
      description: "Forward local port to a pod (returns connection info)",
      inputSchema: {
        "type": "object",
        "properties": {
          "resource": { "type": "string", "description": "Resource (pod/name or svc/name)" },
          "ports": { "type": "string", "description": "Port mapping (local:remote)" },
          "namespace": { "type": "string", "description": "Namespace" }
        },
        "required": ["resource", "ports"]
      }
    }
  ],
  [
    "kubectl_context",
    {
      name: "kubectl_context",
      description: "Manage kubectl contexts (list, current, use)",
      inputSchema: {
        "type": "object",
        "properties": {
          "action": { "type": "string", "enum": ["list", "current", "use"], "description": "Context action" },
          "name": { "type": "string", "description": "Context name for 'use' action" }
        },
        "required": ["action"]
      }
    }
  ],
  [
    "kubectl_top",
    {
      name: "kubectl_top",
      description: "Display resource usage (CPU/memory) for nodes or pods",
      inputSchema: {
        "type": "object",
        "properties": {
          "resource": { "type": "string", "enum": ["nodes", "pods"], "description": "Resource type" },
          "name": { "type": "string", "description": "Optional resource name" },
          "namespace": { "type": "string", "description": "Namespace for pods" },
          "containers": { "type": "boolean", "description": "Show container metrics" }
        },
        "required": ["resource"]
      }
    }
  ],
  [
    "kubectl_create",
    {
      name: "kubectl_create",
      description: "Create resources (namespace, secret, configmap, etc.)",
      inputSchema: {
        "type": "object",
        "properties": {
          "resource": { "type": "string", "description": "Resource type to create" },
          "name": { "type": "string", "description": "Resource name" },
          "namespace": { "type": "string", "description": "Namespace" },
          "fromLiteral": { "type": "object", "description": "Key-value pairs for configmap/secret" },
          "fromFile": { "type": "string", "description": "File path for configmap/secret" }
        },
        "required": ["resource", "name"]
      }
    }
  ]
]);
async function handleToolCall(name, args) {
  let argsDict = getOr(Decode.object(args), {});
  let getString = (key) => getOr(flatMap(argsDict[key], Decode.string), "");
  let getBool = (key) => getOr(flatMap(argsDict[key], Decode.bool), false);
  let getInt = (key) => map(flatMap(argsDict[key], Decode.float), (v) => v | 0);
  let ns = getString("namespace");
  let nsArg = ns !== "" ? [
    "-n",
    ns
  ] : [];
  switch (name) {
    case "kubectl_apply":
      let manifest = getString("manifest");
      let filename = getString("filename");
      let dryRun = getBool("dryRun");
      let args$1 = ["apply"];
      let args$2 = args$1.concat(nsArg);
      let args$3 = dryRun ? args$2.concat(["--dry-run=client"]) : args$2;
      let args$4 = filename !== "" ? args$3.concat([
        "-f",
        filename
      ]) : args$3.concat([
        "-f",
        "-"
      ]);
      if (filename !== "") {
        return await runKubectl(args$4);
      }
      let tmpFile = "/tmp/kubectl-manifest.yaml";
      await Deno.writeTextFile(tmpFile, manifest);
      return await runKubectl(args$4.filter((a) => a !== "-").concat([
        "-f",
        tmpFile
      ]));
    case "kubectl_context":
      let action = getString("action");
      let ctxName = getString("name");
      switch (action) {
        case "current":
          return await runKubectl([
            "config",
            "current-context"
          ]);
        case "list":
          return await runKubectl([
            "config",
            "get-contexts"
          ]);
        case "use":
          return await runKubectl([
            "config",
            "use-context",
            ctxName
          ]);
        default:
          return {
            TAG: "Error",
            _0: "Unknown action: " + action
          };
      }
    case "kubectl_create":
      let resource = getString("resource");
      let resName = getString("name");
      let args$5 = [
        "create",
        resource,
        resName
      ];
      let args$6 = args$5.concat(nsArg);
      return await runKubectl(args$6);
    case "kubectl_delete":
      let resource$1 = getString("resource");
      let resName$1 = getString("name");
      let selector = getString("selector");
      let force = getBool("force");
      let gracePeriod = getInt("gracePeriod");
      let args$7 = [
        "delete",
        resource$1
      ];
      let args$8 = resName$1 !== "" ? args$7.concat([resName$1]) : args$7;
      let args$9 = args$8.concat(nsArg);
      let args$10 = selector !== "" ? args$9.concat([
        "-l",
        selector
      ]) : args$9;
      let args$11 = force ? args$10.concat(["--force"]) : args$10;
      let args$12 = gracePeriod !== void 0 ? args$11.concat([
        "--grace-period",
        gracePeriod.toString()
      ]) : args$11;
      return await runKubectl(args$12);
    case "kubectl_describe":
      let resource$2 = getString("resource");
      let resName$2 = getString("name");
      return await runKubectl([
        "describe",
        resource$2,
        resName$2
      ].concat(nsArg));
    case "kubectl_exec":
      let pod = getString("pod");
      let command = getString("command");
      let container = getString("container");
      let args$13 = [
        "exec",
        pod
      ];
      let args$14 = args$13.concat(nsArg);
      let args$15 = container !== "" ? args$14.concat([
        "-c",
        container
      ]) : args$14;
      let args$16 = args$15.concat([
        "--",
        "sh",
        "-c",
        command
      ]);
      return await runKubectl(args$16);
    case "kubectl_get":
      let resource$3 = getString("resource");
      let resName$3 = getString("name");
      let selector$1 = getString("selector");
      let output = getString("output");
      let allNs = getBool("allNamespaces");
      let args$17 = [
        "get",
        resource$3
      ];
      let args$18 = resName$3 !== "" ? args$17.concat([resName$3]) : args$17;
      let args$19 = allNs ? args$18.concat(["--all-namespaces"]) : args$18.concat(nsArg);
      let args$20 = selector$1 !== "" ? args$19.concat([
        "-l",
        selector$1
      ]) : args$19;
      let args$21 = output !== "" ? args$20.concat([
        "-o",
        output
      ]) : args$20;
      return await runKubectl(args$21);
    case "kubectl_logs":
      let pod$1 = getString("pod");
      let container$1 = getString("container");
      let since = getString("since");
      let tail = getInt("tail");
      let previous = getBool("previous");
      let args$22 = [
        "logs",
        pod$1
      ];
      let args$23 = args$22.concat(nsArg);
      let args$24 = container$1 !== "" ? args$23.concat([
        "-c",
        container$1
      ]) : args$23;
      let args$25 = since !== "" ? args$24.concat([
        "--since",
        since
      ]) : args$24;
      let args$26 = tail !== void 0 ? args$25.concat([
        "--tail",
        tail.toString()
      ]) : args$25;
      let args$27 = previous ? args$26.concat(["--previous"]) : args$26;
      return await runKubectl(args$27);
    case "kubectl_port_forward":
      let resource$4 = getString("resource");
      let ports = getString("ports");
      return {
        TAG: "Ok",
        _0: `Port forward: kubectl port-forward ` + resource$4 + ` ` + ports + ` ` + (ns !== "" ? "-n " + ns : "") + `
Note: Run this command manually as it requires an interactive session.`
      };
    case "kubectl_rollout":
      let action$1 = getString("action");
      let resource$5 = getString("resource");
      let resName$4 = getString("name");
      let revision = getInt("revision");
      let args$28 = [
        "rollout",
        action$1,
        resource$5 + `/` + resName$4
      ];
      let args$29 = args$28.concat(nsArg);
      let args$30 = revision !== void 0 ? args$29.concat([`--to-revision=` + revision.toString()]) : args$29;
      return await runKubectl(args$30);
    case "kubectl_scale":
      let resource$6 = getString("resource");
      let resName$5 = getString("name");
      let replicas = getOr(getInt("replicas"), 1);
      return await runKubectl([
        "scale",
        resource$6 + `/` + resName$5,
        `--replicas=` + replicas.toString()
      ].concat(nsArg));
    case "kubectl_top":
      let resource$7 = getString("resource");
      let resName$6 = getString("name");
      let containers = getBool("containers");
      let args$31 = [
        "top",
        resource$7
      ];
      let args$32 = resName$6 !== "" ? args$31.concat([resName$6]) : args$31;
      let args$33 = resource$7 === "pods" ? args$32.concat(nsArg) : args$32;
      let args$34 = containers ? args$33.concat(["--containers"]) : args$33;
      return await runKubectl(args$34);
    default:
      return {
        TAG: "Error",
        _0: "Unknown tool: " + name
      };
  }
}

// lib/es6/src/adapters/Helm.res.js
async function runHelm(args) {
  let cmd = Command.$$new("helm", args, void 0);
  let output = await cmd.output();
  if (output.success) {
    return {
      TAG: "Ok",
      _0: Command.stdoutText(output)
    };
  } else {
    return {
      TAG: "Error",
      _0: Command.stderrText(output)
    };
  }
}
var tools2 = Object.fromEntries([
  [
    "helm_install",
    {
      name: "helm_install",
      description: "Install a Helm chart",
      inputSchema: {
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
      }
    }
  ],
  [
    "helm_upgrade",
    {
      name: "helm_upgrade",
      description: "Upgrade a Helm release",
      inputSchema: {
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
      }
    }
  ],
  [
    "helm_uninstall",
    {
      name: "helm_uninstall",
      description: "Uninstall a Helm release",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Release name" },
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "keepHistory": { "type": "boolean", "description": "Keep release history" },
          "dryRun": { "type": "boolean", "description": "Simulate uninstall" }
        },
        "required": ["name"]
      }
    }
  ],
  [
    "helm_list",
    {
      name: "helm_list",
      description: "List Helm releases",
      inputSchema: {
        "type": "object",
        "properties": {
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "allNamespaces": { "type": "boolean", "description": "List across all namespaces" },
          "filter": { "type": "string", "description": "Filter by release name regex" },
          "deployed": { "type": "boolean", "description": "Show deployed releases only" },
          "failed": { "type": "boolean", "description": "Show failed releases only" },
          "pending": { "type": "boolean", "description": "Show pending releases only" }
        }
      }
    }
  ],
  [
    "helm_status",
    {
      name: "helm_status",
      description: "Get status of a Helm release",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Release name" },
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "revision": { "type": "integer", "description": "Specific revision" }
        },
        "required": ["name"]
      }
    }
  ],
  [
    "helm_history",
    {
      name: "helm_history",
      description: "Get release history",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Release name" },
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "max": { "type": "integer", "description": "Maximum revisions to show" }
        },
        "required": ["name"]
      }
    }
  ],
  [
    "helm_rollback",
    {
      name: "helm_rollback",
      description: "Rollback a release to a previous revision",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Release name" },
          "revision": { "type": "integer", "description": "Revision number to rollback to" },
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "dryRun": { "type": "boolean", "description": "Simulate rollback" },
          "wait": { "type": "boolean", "description": "Wait for resources to be ready" }
        },
        "required": ["name", "revision"]
      }
    }
  ],
  [
    "helm_repo_add",
    {
      name: "helm_repo_add",
      description: "Add a Helm chart repository",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Repository name" },
          "url": { "type": "string", "description": "Repository URL" },
          "username": { "type": "string", "description": "Username for auth" },
          "password": { "type": "string", "description": "Password for auth" },
          "forceUpdate": { "type": "boolean", "description": "Replace existing repo" }
        },
        "required": ["name", "url"]
      }
    }
  ],
  [
    "helm_repo_list",
    {
      name: "helm_repo_list",
      description: "List configured Helm repositories",
      inputSchema: {
        "type": "object",
        "properties": {}
      }
    }
  ],
  [
    "helm_repo_update",
    {
      name: "helm_repo_update",
      description: "Update Helm repository cache",
      inputSchema: {
        "type": "object",
        "properties": {
          "repos": { "type": "array", "items": { "type": "string" }, "description": "Specific repos to update" }
        }
      }
    }
  ],
  [
    "helm_search",
    {
      name: "helm_search",
      description: "Search for Helm charts",
      inputSchema: {
        "type": "object",
        "properties": {
          "keyword": { "type": "string", "description": "Search keyword" },
          "source": { "type": "string", "enum": ["repo", "hub"], "description": "Search repos or Artifact Hub" },
          "version": { "type": "string", "description": "Version constraint" },
          "versions": { "type": "boolean", "description": "Show all versions" }
        },
        "required": ["keyword"]
      }
    }
  ],
  [
    "helm_show",
    {
      name: "helm_show",
      description: "Show chart information (values, readme, chart)",
      inputSchema: {
        "type": "object",
        "properties": {
          "chart": { "type": "string", "description": "Chart reference" },
          "info": { "type": "string", "enum": ["all", "chart", "readme", "values", "crds"], "description": "What to show" },
          "version": { "type": "string", "description": "Chart version" }
        },
        "required": ["chart"]
      }
    }
  ],
  [
    "helm_template",
    {
      name: "helm_template",
      description: "Render chart templates locally",
      inputSchema: {
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
      }
    }
  ],
  [
    "helm_get",
    {
      name: "helm_get",
      description: "Get release information (values, manifest, notes, hooks)",
      inputSchema: {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Release name" },
          "info": { "type": "string", "enum": ["all", "values", "manifest", "notes", "hooks"], "description": "What to get" },
          "namespace": { "type": "string", "description": "Kubernetes namespace" },
          "revision": { "type": "integer", "description": "Specific revision" }
        },
        "required": ["name"]
      }
    }
  ]
]);
async function handleToolCall2(name, args) {
  let argsDict = getOr(Decode.object(args), {});
  let getString = (key) => getOr(flatMap(argsDict[key], Decode.string), "");
  let getBool = (key) => getOr(flatMap(argsDict[key], Decode.bool), false);
  let getInt = (key) => map(flatMap(argsDict[key], Decode.float), (v) => v | 0);
  let ns = getString("namespace");
  let nsArg = ns !== "" ? [
    "-n",
    ns
  ] : [];
  switch (name) {
    case "helm_get":
      let relName = getString("name");
      let info = getString("info");
      let revision = getInt("revision");
      let getCmd = info !== "" ? info : "all";
      let args$1 = [
        "get",
        getCmd,
        relName
      ];
      let args$2 = args$1.concat(nsArg);
      let args$3 = revision !== void 0 ? args$2.concat([
        "--revision",
        revision.toString()
      ]) : args$2;
      return await runHelm(args$3);
    case "helm_history":
      let relName$1 = getString("name");
      let max = getInt("max");
      let args$4 = [
        "history",
        relName$1
      ];
      let args$5 = args$4.concat(nsArg);
      let args$6 = max !== void 0 ? args$5.concat([
        "--max",
        max.toString()
      ]) : args$5;
      return await runHelm(args$6);
    case "helm_install":
      let relName$2 = getString("name");
      let chart = getString("chart");
      let version = getString("version");
      let valuesFile = getString("valuesFile");
      let createNs = getBool("createNamespace");
      let dryRun = getBool("dryRun");
      let wait = getBool("wait");
      let args$7 = [
        "install",
        relName$2,
        chart
      ];
      let args$8 = args$7.concat(nsArg);
      let args$9 = version !== "" ? args$8.concat([
        "--version",
        version
      ]) : args$8;
      let args$10 = valuesFile !== "" ? args$9.concat([
        "-f",
        valuesFile
      ]) : args$9;
      let args$11 = createNs ? args$10.concat(["--create-namespace"]) : args$10;
      let args$12 = dryRun ? args$11.concat(["--dry-run"]) : args$11;
      let args$13 = wait ? args$12.concat(["--wait"]) : args$12;
      return await runHelm(args$13);
    case "helm_list":
      let allNs = getBool("allNamespaces");
      let filter = getString("filter");
      let deployed = getBool("deployed");
      let failed = getBool("failed");
      let pending = getBool("pending");
      let args$14 = ["list"];
      let args$15 = allNs ? args$14.concat(["--all-namespaces"]) : args$14.concat(nsArg);
      let args$16 = filter !== "" ? args$15.concat([
        "--filter",
        filter
      ]) : args$15;
      let args$17 = deployed ? args$16.concat(["--deployed"]) : args$16;
      let args$18 = failed ? args$17.concat(["--failed"]) : args$17;
      let args$19 = pending ? args$18.concat(["--pending"]) : args$18;
      return await runHelm(args$19);
    case "helm_repo_add":
      let repoName = getString("name");
      let url = getString("url");
      let username = getString("username");
      let password = getString("password");
      let forceUpdate = getBool("forceUpdate");
      let args$20 = [
        "repo",
        "add",
        repoName,
        url
      ];
      let args$21 = username !== "" ? args$20.concat([
        "--username",
        username
      ]) : args$20;
      let args$22 = password !== "" ? args$21.concat([
        "--password",
        password
      ]) : args$21;
      let args$23 = forceUpdate ? args$22.concat(["--force-update"]) : args$22;
      return await runHelm(args$23);
    case "helm_repo_list":
      return await runHelm([
        "repo",
        "list"
      ]);
    case "helm_repo_update":
      return await runHelm([
        "repo",
        "update"
      ]);
    case "helm_rollback":
      let relName$3 = getString("name");
      let revision$1 = getOr(getInt("revision"), 0);
      let dryRun$1 = getBool("dryRun");
      let wait$1 = getBool("wait");
      let args$24 = [
        "rollback",
        relName$3,
        revision$1.toString()
      ];
      let args$25 = args$24.concat(nsArg);
      let args$26 = dryRun$1 ? args$25.concat(["--dry-run"]) : args$25;
      let args$27 = wait$1 ? args$26.concat(["--wait"]) : args$26;
      return await runHelm(args$27);
    case "helm_search":
      let keyword = getString("keyword");
      let source = getString("source");
      let version$1 = getString("version");
      let versions = getBool("versions");
      let searchCmd = source === "hub" ? "hub" : "repo";
      let args$28 = [
        "search",
        searchCmd,
        keyword
      ];
      let args$29 = version$1 !== "" ? args$28.concat([
        "--version",
        version$1
      ]) : args$28;
      let args$30 = versions ? args$29.concat(["--versions"]) : args$29;
      return await runHelm(args$30);
    case "helm_show":
      let chart$1 = getString("chart");
      let info$1 = getString("info");
      let version$2 = getString("version");
      let showCmd = info$1 !== "" ? info$1 : "all";
      let args$31 = [
        "show",
        showCmd,
        chart$1
      ];
      let args$32 = version$2 !== "" ? args$31.concat([
        "--version",
        version$2
      ]) : args$31;
      return await runHelm(args$32);
    case "helm_status":
      let relName$4 = getString("name");
      let revision$2 = getInt("revision");
      let args$33 = [
        "status",
        relName$4
      ];
      let args$34 = args$33.concat(nsArg);
      let args$35 = revision$2 !== void 0 ? args$34.concat([
        "--revision",
        revision$2.toString()
      ]) : args$34;
      return await runHelm(args$35);
    case "helm_template":
      let relName$5 = getString("name");
      let chart$2 = getString("chart");
      let version$3 = getString("version");
      let valuesFile$1 = getString("valuesFile");
      let args$36 = [
        "template",
        relName$5,
        chart$2
      ];
      let args$37 = args$36.concat(nsArg);
      let args$38 = version$3 !== "" ? args$37.concat([
        "--version",
        version$3
      ]) : args$37;
      let args$39 = valuesFile$1 !== "" ? args$38.concat([
        "-f",
        valuesFile$1
      ]) : args$38;
      return await runHelm(args$39);
    case "helm_uninstall":
      let relName$6 = getString("name");
      let keepHistory = getBool("keepHistory");
      let dryRun$2 = getBool("dryRun");
      let args$40 = [
        "uninstall",
        relName$6
      ];
      let args$41 = args$40.concat(nsArg);
      let args$42 = keepHistory ? args$41.concat(["--keep-history"]) : args$41;
      let args$43 = dryRun$2 ? args$42.concat(["--dry-run"]) : args$42;
      return await runHelm(args$43);
    case "helm_upgrade":
      let relName$7 = getString("name");
      let chart$3 = getString("chart");
      let version$4 = getString("version");
      let valuesFile$2 = getString("valuesFile");
      let install = getBool("install");
      let dryRun$3 = getBool("dryRun");
      let wait$2 = getBool("wait");
      let reuseValues = getBool("reuseValues");
      let args$44 = [
        "upgrade",
        relName$7,
        chart$3
      ];
      let args$45 = args$44.concat(nsArg);
      let args$46 = version$4 !== "" ? args$45.concat([
        "--version",
        version$4
      ]) : args$45;
      let args$47 = valuesFile$2 !== "" ? args$46.concat([
        "-f",
        valuesFile$2
      ]) : args$46;
      let args$48 = install ? args$47.concat(["--install"]) : args$47;
      let args$49 = dryRun$3 ? args$48.concat(["--dry-run"]) : args$48;
      let args$50 = wait$2 ? args$49.concat(["--wait"]) : args$49;
      let args$51 = reuseValues ? args$50.concat(["--reuse-values"]) : args$50;
      return await runHelm(args$51);
    default:
      return {
        TAG: "Error",
        _0: "Unknown tool: " + name
      };
  }
}

// node_modules/@rescript/runtime/lib/es6/Stdlib_Array.js
function filterMap(a, f) {
  let l = a.length;
  let r = new Array(l);
  let j = 0;
  for (let i = 0; i < l; ++i) {
    let v = a[i];
    let v$1 = f(v);
    if (v$1 !== void 0) {
      r[j] = valFromOption(v$1);
      j = j + 1 | 0;
    }
  }
  r.length = j;
  return r;
}

// lib/es6/src/adapters/Kustomize.res.js
async function runKustomize(args) {
  let cmd = Command.$$new("kustomize", args, void 0);
  let output = await cmd.output();
  if (output.success) {
    return {
      TAG: "Ok",
      _0: Command.stdoutText(output)
    };
  } else {
    return {
      TAG: "Error",
      _0: Command.stderrText(output)
    };
  }
}
async function runKubectl2(args) {
  let cmd = Command.$$new("kubectl", args, void 0);
  let output = await cmd.output();
  if (output.success) {
    return {
      TAG: "Ok",
      _0: Command.stdoutText(output)
    };
  } else {
    return {
      TAG: "Error",
      _0: Command.stderrText(output)
    };
  }
}
var tools3 = Object.fromEntries([
  [
    "kustomize_build",
    {
      name: "kustomize_build",
      description: "Build a kustomization directory into YAML manifests",
      inputSchema: {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "Path to kustomization directory" },
          "output": { "type": "string", "description": "Output file path (optional, stdout if not set)" },
          "enableHelm": { "type": "boolean", "description": "Enable Helm chart inflation" },
          "loadRestrictor": { "type": "string", "enum": ["LoadRestrictionsNone", "LoadRestrictionsRootOnly"], "description": "Load restriction policy" }
        },
        "required": ["path"]
      }
    }
  ],
  [
    "kustomize_apply",
    {
      name: "kustomize_apply",
      description: "Build and apply kustomization to cluster (kubectl apply -k)",
      inputSchema: {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "Path to kustomization directory" },
          "namespace": { "type": "string", "description": "Target namespace" },
          "dryRun": { "type": "boolean", "description": "Run in dry-run mode" },
          "serverSide": { "type": "boolean", "description": "Use server-side apply" },
          "prune": { "type": "boolean", "description": "Prune resources not in manifest" }
        },
        "required": ["path"]
      }
    }
  ],
  [
    "kustomize_create",
    {
      name: "kustomize_create",
      description: "Create a new kustomization.yaml file",
      inputSchema: {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "Directory for new kustomization" },
          "resources": { "type": "array", "items": { "type": "string" }, "description": "Resource files to include" },
          "namespace": { "type": "string", "description": "Namespace to set" },
          "namePrefix": { "type": "string", "description": "Prefix for all resource names" },
          "nameSuffix": { "type": "string", "description": "Suffix for all resource names" }
        },
        "required": ["path"]
      }
    }
  ],
  [
    "kustomize_edit_add",
    {
      name: "kustomize_edit_add",
      description: "Add items to kustomization (resource, patch, configmap, secret, etc.)",
      inputSchema: {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "Path to kustomization directory" },
          "type": { "type": "string", "enum": ["resource", "patch", "configmap", "secret", "base", "label", "annotation"], "description": "What to add" },
          "name": { "type": "string", "description": "Name (for configmap/secret)" },
          "file": { "type": "string", "description": "File path to add" },
          "literal": { "type": "string", "description": "Literal value (key=value)" }
        },
        "required": ["path", "type"]
      }
    }
  ],
  [
    "kustomize_edit_set",
    {
      name: "kustomize_edit_set",
      description: "Set values in kustomization (namespace, nameprefix, namesuffix, image)",
      inputSchema: {
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
      }
    }
  ],
  [
    "kustomize_edit_remove",
    {
      name: "kustomize_edit_remove",
      description: "Remove items from kustomization",
      inputSchema: {
        "type": "object",
        "properties": {
          "path": { "type": "string", "description": "Path to kustomization directory" },
          "type": { "type": "string", "enum": ["resource", "patch", "transformer", "buildmetadata"], "description": "What to remove" },
          "file": { "type": "string", "description": "File path to remove" }
        },
        "required": ["path", "type", "file"]
      }
    }
  ],
  [
    "kustomize_cfg",
    {
      name: "kustomize_cfg",
      description: "Run kustomize cfg commands (cat, count, grep, tree)",
      inputSchema: {
        "type": "object",
        "properties": {
          "command": { "type": "string", "enum": ["cat", "count", "grep", "tree"], "description": "cfg subcommand" },
          "path": { "type": "string", "description": "Path to resources" },
          "pattern": { "type": "string", "description": "Pattern for grep" }
        },
        "required": ["command", "path"]
      }
    }
  ],
  [
    "kustomize_version",
    {
      name: "kustomize_version",
      description: "Show kustomize version",
      inputSchema: {
        "type": "object",
        "properties": {}
      }
    }
  ]
]);
async function handleToolCall3(name, args) {
  let argsDict = getOr(Decode.object(args), {});
  let getString = (key) => getOr(flatMap(argsDict[key], Decode.string), "");
  let getBool = (key) => getOr(flatMap(argsDict[key], Decode.bool), false);
  let getArray = (key) => getOr(flatMap(argsDict[key], Decode.array), []);
  switch (name) {
    case "kustomize_apply":
      let path = getString("path");
      let ns = getString("namespace");
      let dryRun = getBool("dryRun");
      let serverSide = getBool("serverSide");
      let prune = getBool("prune");
      let args$1 = [
        "apply",
        "-k",
        path
      ];
      let args$2 = ns !== "" ? args$1.concat([
        "-n",
        ns
      ]) : args$1;
      let args$3 = dryRun ? args$2.concat(["--dry-run=client"]) : args$2;
      let args$4 = serverSide ? args$3.concat(["--server-side"]) : args$3;
      let args$5 = prune ? args$4.concat(["--prune"]) : args$4;
      return await runKubectl2(args$5);
    case "kustomize_build":
      let path$1 = getString("path");
      let output = getString("output");
      let enableHelm = getBool("enableHelm");
      let loadRestrictor = getString("loadRestrictor");
      let args$6 = [
        "build",
        path$1
      ];
      let args$7 = enableHelm ? args$6.concat(["--enable-helm"]) : args$6;
      let args$8 = loadRestrictor !== "" ? args$7.concat([
        "--load-restrictor",
        loadRestrictor
      ]) : args$7;
      let args$9 = output !== "" ? args$8.concat([
        "-o",
        output
      ]) : args$8;
      return await runKustomize(args$9);
    case "kustomize_cfg":
      let command = getString("command");
      let path$2 = getString("path");
      let pattern = getString("pattern");
      let args$10 = [
        "cfg",
        command,
        path$2
      ];
      let args$11 = pattern !== "" && command === "grep" ? args$10.concat([pattern]) : args$10;
      return await runKustomize(args$11);
    case "kustomize_create":
      let path$3 = getString("path");
      let resources = filterMap(getArray("resources"), Decode.string);
      let ns$1 = getString("namespace");
      let namePrefix = getString("namePrefix");
      let nameSuffix = getString("nameSuffix");
      let kustomization = `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
` + (ns$1 !== "" ? "namespace: " + ns$1 + "\n" : "") + (namePrefix !== "" ? "namePrefix: " + namePrefix + "\n" : "") + (nameSuffix !== "" ? "nameSuffix: " + nameSuffix + "\n" : "") + `resources:
` + resources.map((r) => "  - " + r).join("\n") + `
`;
      let filePath = path$3 + "/kustomization.yaml";
      await Deno.writeTextFile(filePath, kustomization);
      return {
        TAG: "Ok",
        _0: "Created " + filePath
      };
    case "kustomize_edit_add":
      let path$4 = getString("path");
      let addType = getString("type");
      let addName = getString("name");
      let file = getString("file");
      let literal = getString("literal");
      let args$12 = [
        "edit",
        "add",
        addType
      ];
      let args$13;
      let exit = 0;
      switch (addType) {
        case "annotation":
        case "label":
          args$13 = args$12.concat([literal]);
          break;
        case "base":
        case "patch":
        case "resource":
          args$13 = args$12.concat([file]);
          break;
        case "configmap":
        case "secret":
          exit = 1;
          break;
        default:
          args$13 = args$12;
      }
      if (exit === 1) {
        let args$14 = args$12.concat([addName]);
        let args$15 = file !== "" ? args$14.concat(["--from-file=" + file]) : args$14;
        args$13 = literal !== "" ? args$15.concat(["--from-literal=" + literal]) : args$15;
      }
      let cmd = Command.$$new("kustomize", args$13, path$4);
      let output$1 = await cmd.output();
      if (output$1.success) {
        return {
          TAG: "Ok",
          _0: Command.stdoutText(output$1)
        };
      } else {
        return {
          TAG: "Error",
          _0: Command.stderrText(output$1)
        };
      }
    case "kustomize_edit_remove":
      let path$5 = getString("path");
      let removeType = getString("type");
      let file$1 = getString("file");
      let cmd$1 = Command.$$new("kustomize", [
        "edit",
        "remove",
        removeType,
        file$1
      ], path$5);
      let output$2 = await cmd$1.output();
      if (output$2.success) {
        return {
          TAG: "Ok",
          _0: Command.stdoutText(output$2)
        };
      } else {
        return {
          TAG: "Error",
          _0: Command.stderrText(output$2)
        };
      }
    case "kustomize_edit_set":
      let path$6 = getString("path");
      let setType = getString("type");
      let value = getString("value");
      let newName = getString("newName");
      let newTag = getString("newTag");
      let digest = getString("digest");
      let args$16;
      if (setType === "image") {
        let imgArg = newName !== "" && newTag !== "" ? value + `=` + newName + `:` + newTag : newTag !== "" ? value + `:` + newTag : digest !== "" ? value + `@` + digest : value;
        args$16 = [
          "edit",
          "set",
          "image",
          imgArg
        ];
      } else {
        args$16 = [
          "edit",
          "set",
          setType,
          value
        ];
      }
      let cmd$2 = Command.$$new("kustomize", args$16, path$6);
      let output$3 = await cmd$2.output();
      if (output$3.success) {
        return {
          TAG: "Ok",
          _0: Command.stdoutText(output$3)
        };
      } else {
        return {
          TAG: "Error",
          _0: Command.stderrText(output$3)
        };
      }
    case "kustomize_version":
      return await runKustomize(["version"]);
    default:
      return {
        TAG: "Error",
        _0: "Unknown tool: " + name
      };
  }
}

// main.js
var SERVER_INFO = {
  name: "poly-k8s-mcp",
  version: "1.0.0",
  description: "Kubernetes orchestration MCP server (kubectl, helm, kustomize)"
};
var allTools = {
  ...tools,
  ...tools2,
  ...tools3
};
async function handleToolCall4(name, args) {
  if (name.startsWith("kubectl_")) {
    return await handleToolCall(name, args);
  } else if (name.startsWith("helm_")) {
    return await handleToolCall2(name, args);
  } else if (name.startsWith("kustomize_")) {
    return await handleToolCall3(name, args);
  }
  return { TAG: "Error", _0: `Unknown tool: ${name}` };
}
function handleInitialize(id) {
  return {
    jsonrpc: "2.0",
    id,
    result: {
      protocolVersion: "2024-11-05",
      serverInfo: SERVER_INFO,
      capabilities: {
        tools: { listChanged: false }
      }
    }
  };
}
function handleToolsList(id) {
  const toolsList = Object.values(allTools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
  return {
    jsonrpc: "2.0",
    id,
    result: { tools: toolsList }
  };
}
async function handleToolsCall(id, params) {
  const { name, arguments: args } = params;
  const result = await handleToolCall4(name, args || {});
  if (result.TAG === "Ok") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: result._0 }]
      }
    };
  } else {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [{ type: "text", text: `Error: ${result._0}` }],
        isError: true
      }
    };
  }
}
async function handleMessage(message) {
  const { method, id, params } = message;
  switch (method) {
    case "initialize":
      return handleInitialize(id);
    case "initialized":
      return null;
    // Notification, no response
    case "tools/list":
      return handleToolsList(id);
    case "tools/call":
      return await handleToolsCall(id, params);
    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
}
var decoder2 = new TextDecoder();
var encoder = new TextEncoder();
async function readMessage() {
  const buffer = new Uint8Array(65536);
  let data = "";
  while (true) {
    const n = await Deno.stdin.read(buffer);
    if (n === null) return null;
    data += decoder2.decode(buffer.subarray(0, n));
    const headerEnd = data.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;
    const header = data.substring(0, headerEnd);
    const contentLengthMatch = header.match(/Content-Length: (\d+)/i);
    if (!contentLengthMatch) continue;
    const contentLength = parseInt(contentLengthMatch[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    if (data.length < bodyEnd) continue;
    const body = data.substring(bodyStart, bodyEnd);
    data = data.substring(bodyEnd);
    return JSON.parse(body);
  }
}
function writeMessage(message) {
  const body = JSON.stringify(message);
  const header = `Content-Length: ${encoder.encode(body).length}\r
\r
`;
  Deno.stdout.writeSync(encoder.encode(header + body));
}
async function main() {
  while (true) {
    const message = await readMessage();
    if (message === null) break;
    const response = await handleMessage(message);
    if (response !== null) {
      writeMessage(response);
    }
  }
}
main().catch(console.error);

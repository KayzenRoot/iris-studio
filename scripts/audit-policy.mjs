import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const exceptionPath = join(repositoryRoot, ".engineering", "security-exceptions", "IRIS-STUDIO-SEC-0001.json");
const lockfilePath = join(repositoryRoot, "package-lock.json");
const evidenceRoot = join(repositoryRoot, ".engineering", "evidence", "IRIS-STUDIO-SEC-0001", "runs");
const maxAuditOutputBytes = 32 * 1024 * 1024;

function packageNameForNode(node) {
  const marker = "node_modules/";
  const index = node.lastIndexOf(marker);
  return index < 0 ? node : node.slice(index + marker.length);
}

function resolveDependencyNode(fromNode, dependencyName, packages) {
  let base = fromNode;
  for (;;) {
    const candidate = base ? `${base}/node_modules/${dependencyName}` : `node_modules/${dependencyName}`;
    if (Object.hasOwn(packages, candidate)) return candidate;
    if (!base) return null;
    const marker = base.lastIndexOf("/node_modules/");
    base = marker >= 0 ? base.slice(0, marker) : "";
  }
}

function findPathsToNode(lockfile, targetNode) {
  const packages = lockfile.packages ?? {};
  const root = packages[""] ?? {};
  const paths = [];
  const seen = new Set();
  let visited = 0;

  function visit(rootKind, currentNode, nodes, activeNodes) {
    visited += 1;
    if (visited > 100_000) throw new Error("Dependency graph exceeded audit-policy traversal bound.");
    if (currentNode === targetNode) {
      const path = `root:${rootKind} > ${nodes.map((node) => `${packageNameForNode(node)}@${packages[node]?.version ?? "unknown"}`).join(" > ")}`;
      const key = `${rootKind}:${nodes.join(">")}`;
      if (!seen.has(key)) {
        seen.add(key);
        paths.push({ rootKind, nodes: [...nodes], path });
      }
    }
    const dependencies = packages[currentNode]?.dependencies ?? {};
    for (const dependencyName of Object.keys(dependencies)) {
      const childNode = resolveDependencyNode(currentNode, dependencyName, packages);
      if (!childNode || activeNodes.has(childNode)) continue;
      const nextActive = new Set(activeNodes);
      nextActive.add(childNode);
      visit(rootKind, childNode, [...nodes, childNode], nextActive);
    }
  }

  for (const rootKind of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const dependencies = root[rootKind] ?? {};
    for (const dependencyName of Object.keys(dependencies)) {
      const node = resolveDependencyNode("", dependencyName, packages);
      if (node) visit(rootKind, node, [node], new Set([node]));
    }
  }
  return paths;
}

export function collectAdvisoryIds(packageName, vulnerabilities, visited = new Set()) {
  if (visited.has(packageName)) return [];
  visited.add(packageName);
  const vulnerability = vulnerabilities?.[packageName];
  if (!vulnerability) return [];
  const ids = [];
  for (const via of vulnerability.via ?? []) {
    if (typeof via === "string") {
      ids.push(...collectAdvisoryIds(via, vulnerabilities, visited));
    } else if (via && typeof via === "object") {
      const fromUrl = typeof via.url === "string" ? /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i.exec(via.url)?.[0] : undefined;
      const fromId = typeof via.id === "string" && /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(via.id) ? via.id : undefined;
      const advisory = fromUrl ?? fromId;
      if (advisory) ids.push(advisory.toUpperCase());
    }
  }
  return [...new Set(ids)];
}

function hasCompatibleFix(fixAvailable) {
  if (fixAvailable === true) return true;
  if (!fixAvailable || typeof fixAvailable !== "object") return false;
  return fixAvailable.isSemVerMajor !== true;
}

function severityRank(severity) {
  return severity === "critical" ? 4 : severity === "high" ? 3 : severity === "moderate" ? 2 : severity === "low" ? 1 : 0;
}

export function evaluateAuditPolicy({ fullAudit, productionAudit, lockfile, policy, productionHighExitCode, now = new Date() }) {
  const errors = [];
  const usedAllowlistEntries = new Set();
  const allowedAdvisories = new Set();

  if (!policy || policy.id !== "IRIS-STUDIO-SEC-0001" || policy.status !== "ACTIVE") {
    errors.push("IRIS-STUDIO-SEC-0001 is missing or not ACTIVE.");
  }
  for (const advisory of policy?.advisories ?? []) {
    if (!/^GHSA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(advisory.id ?? "")) {
      errors.push(`Invalid or wildcard advisory identifier: ${String(advisory.id)}.`);
      continue;
    }
    allowedAdvisories.add(advisory.id.toUpperCase());
    if (!Array.isArray(advisory.officialFixedVersions) || advisory.officialFixedVersions.length > 0) {
      errors.push(`${advisory.id} has an official fixed version; remove the active exception and update dependencies.`);
    }
  }

  const approvedAt = Date.parse(`${policy?.approvedOn ?? "invalid"}T00:00:00.000Z`);
  const reviewAt = Date.parse(`${policy?.reviewDue ?? "invalid"}T00:00:00.000Z`);
  if (!Number.isFinite(approvedAt) || !Number.isFinite(reviewAt) || reviewAt <= approvedAt || reviewAt - approvedAt > 14 * 24 * 60 * 60 * 1000) {
    errors.push("Exception review deadline must be within 14 days of approval.");
  } else if (now.getTime() >= reviewAt) {
    errors.push("IRIS-STUDIO-SEC-0001 has expired; review and remove or renew it before passing the gate.");
  }

  const expectedEntries = new Map();
  for (const entry of policy?.findings ?? []) {
    const key = `${entry.package}|${entry.version}|${entry.advisoryId?.toUpperCase()}|${entry.dependencyPath}`;
    if (expectedEntries.has(key)) errors.push(`Duplicate exception finding entry: ${key}.`);
    expectedEntries.set(key, entry);
    if (entry.scope !== "dev-only" || entry.severity !== "high" || !allowedAdvisories.has(entry.advisoryId?.toUpperCase())) {
      errors.push(`Exception finding is not an exact dev-only High: ${key}.`);
    }
  }

  const fullVulnerabilities = fullAudit?.vulnerabilities;
  if (!fullVulnerabilities || !fullAudit?.metadata?.vulnerabilities) {
    errors.push("Full npm audit JSON is incomplete or invalid.");
  } else {
    if ((fullAudit.metadata.vulnerabilities.critical ?? 0) > 0) errors.push("Full npm audit summary contains Critical findings.");
    const observedHighCount = Object.values(fullVulnerabilities).filter((vulnerability) => vulnerability.severity === "high").length;
    const observedCriticalCount = Object.values(fullVulnerabilities).filter((vulnerability) => vulnerability.severity === "critical").length;
    if (observedHighCount !== fullAudit.metadata.vulnerabilities.high || observedCriticalCount !== fullAudit.metadata.vulnerabilities.critical) {
      errors.push("Full npm audit summary does not match its package findings.");
    }
    for (const advisory of policy?.advisories ?? []) {
      const sourceFinding = fullVulnerabilities[advisory.affectedPackage];
      const sourceAdvisory = (sourceFinding?.via ?? []).find((via) => typeof via === "object"
        && (via.url === advisory.officialSource || via.url?.toUpperCase().endsWith(advisory.id.toUpperCase())));
      if (!sourceAdvisory || sourceAdvisory.range !== advisory.affectedRange || sourceAdvisory.severity !== advisory.severity) {
        errors.push(`${advisory.id} no longer matches its exact package/range/severity in npm audit; review the exception.`);
      }
    }
    for (const [packageName, vulnerability] of Object.entries(fullVulnerabilities)) {
      if (severityRank(vulnerability.severity) < 3) continue;
      if (vulnerability.severity === "critical") {
        errors.push(`Critical vulnerability blocks the gate: ${packageName}.`);
        continue;
      }
      const advisoryIds = collectAdvisoryIds(packageName, fullVulnerabilities);
      if (advisoryIds.length === 0) {
        errors.push(`High finding has no exact advisory mapping: ${packageName}.`);
        continue;
      }
      const unapproved = advisoryIds.filter((id) => !allowedAdvisories.has(id));
      if (unapproved.length) errors.push(`High finding uses non-allowlisted advisory: ${packageName} (${unapproved.join(", ")}).`);

      const nodes = Array.isArray(vulnerability.nodes) ? vulnerability.nodes : [];
      if (!nodes.length) {
        errors.push(`High finding has no installed node identity: ${packageName}.`);
        continue;
      }
      for (const advisoryId of advisoryIds.filter((id) => allowedAdvisories.has(id))) {
        for (const node of nodes) {
          const installed = lockfile?.packages?.[node];
          if (!installed || typeof installed.version !== "string") {
            errors.push(`High finding node is missing from package-lock: ${packageName} (${node}).`);
            continue;
          }
          if (installed.dev !== true) errors.push(`Allowlisted finding is not dev-only in package-lock: ${packageName} (${node}).`);
          const paths = findPathsToNode(lockfile, node);
          if (!paths.length) errors.push(`Could not prove a root dependency path for ${packageName} (${node}).`);
          for (const dependencyPath of paths) {
            if (dependencyPath.rootKind !== "devDependencies") {
              errors.push(`Allowlisted finding is reachable outside devDependencies: ${dependencyPath.path}.`);
              continue;
            }
            const key = `${packageName}|${installed.version}|${advisoryId.toUpperCase()}|${dependencyPath.path}`;
            const approved = expectedEntries.get(key);
            if (!approved || approved.node !== node) {
              errors.push(`High finding identity/path is not exactly allowlisted: ${key}.`);
            } else {
              usedAllowlistEntries.add(key);
            }
          }
        }
      }
      if (hasCompatibleFix(vulnerability.fixAvailable)) {
        errors.push(`Compatible npm fix is available for ${packageName}; remove the exception and update safely.`);
      } else if (vulnerability.fixAvailable && typeof vulnerability.fixAvailable === "object") {
        for (const advisoryId of advisoryIds.filter((id) => allowedAdvisories.has(id))) {
          const recorded = policy.advisories.find((entry) => entry.id.toUpperCase() === advisoryId.toUpperCase())?.npmFixAvailableObserved;
          const current = vulnerability.fixAvailable;
          if (!recorded || current.name !== recorded.name || current.version !== recorded.version || current.isSemVerMajor !== recorded.isSemVerMajor) {
            errors.push(`npm fixAvailable changed for ${packageName}; re-review the exception before proceeding.`);
          }
        }
      }
    }

    for (const [key] of expectedEntries) {
      if (!usedAllowlistEntries.has(key)) errors.push(`Exception entry is stale or not observed in the current audit: ${key}.`);
    }
    if (expectedEntries.size && usedAllowlistEntries.size === 0) errors.push("Active exception is unused; remove it immediately.");
  }

  const recordedPaths = policy?.advisoryPaths ?? [];
  for (const record of recordedPaths) {
    if (!allowedAdvisories.has(record.advisoryId?.toUpperCase()) || !Array.isArray(record.nodes) || record.nodes.length < 2) {
      errors.push(`Invalid recorded dependency path for ${String(record.advisoryId)}.`);
      continue;
    }
    const leaf = record.nodes.at(-1);
    const actualPaths = findPathsToNode(lockfile, leaf);
    const actualPath = actualPaths.find((path) => path.rootKind === "devDependencies" && JSON.stringify(path.nodes) === JSON.stringify(record.nodes));
    if (!actualPath) {
      errors.push(`Recorded advisory dependency path is absent or changed: ${record.nodes.join(" > ")}.`);
      continue;
    }
    for (const finding of (policy?.findings ?? []).filter((entry) => entry.advisoryId?.toUpperCase() === record.advisoryId.toUpperCase())) {
      if (finding.advisoryPath !== actualPath.path) errors.push(`Recorded full advisory path differs for ${finding.package}: ${finding.advisoryPath}.`);
    }
  }

  if (productionHighExitCode !== 0) errors.push(`npm audit --omit=dev --audit-level=high failed (exit ${productionHighExitCode}).`);
  const productionVulnerabilities = productionAudit?.vulnerabilities;
  if (!productionVulnerabilities || !productionAudit?.metadata?.vulnerabilities) {
    errors.push("Production-only npm audit JSON is incomplete or invalid.");
  } else {
    if ((productionAudit.metadata.vulnerabilities.high ?? 0) > 0 || (productionAudit.metadata.vulnerabilities.critical ?? 0) > 0) {
      errors.push("Production-only npm audit summary contains High/Critical findings.");
    }
    for (const [packageName, vulnerability] of Object.entries(productionVulnerabilities)) {
      const advisoryIds = collectAdvisoryIds(packageName, productionVulnerabilities);
      const allowlistedPresent = advisoryIds.some((id) => allowedAdvisories.has(id));
      if (allowlistedPresent) errors.push(`Allowlisted advisory appears in production dependencies: ${packageName} (${advisoryIds.join(", ")}).`);
      if (severityRank(vulnerability.severity) >= 3) errors.push(`High/Critical production dependency finding blocks the gate: ${packageName}.`);
    }
  }

  return {
    pass: errors.length === 0,
    errors,
    allowedFindingCount: usedAllowlistEntries.size,
    fullAuditCounts: fullAudit?.metadata?.vulnerabilities ?? null,
    productionAuditCounts: productionAudit?.metadata?.vulnerabilities ?? null,
  };
}

function parseJsonOutput(result, command, errors) {
  const text = result.stdout.toString("utf8");
  try {
    return JSON.parse(text);
  } catch {
    errors.push(`${command} did not produce parseable JSON.`);
    return null;
  }
}

function runNpm(npmCli, args) {
  return spawnSync(process.execPath, [npmCli, ...args], {
    cwd: repositoryRoot,
    env: process.env,
    encoding: null,
    maxBuffer: maxAuditOutputBytes,
    shell: false,
    windowsHide: true,
  });
}

function outputBytes(result, stream) {
  const value = result?.[stream];
  if (Buffer.isBuffer(value)) return value;
  return Buffer.from(value == null ? "" : String(value), "utf8");
}

function createEvidenceDirectory() {
  mkdirSync(evidenceRoot, { recursive: true });
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  let directory = join(evidenceRoot, stamp);
  let suffix = 1;
  while (true) {
    try {
      mkdirSync(directory);
      return directory;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      directory = join(evidenceRoot, `${stamp}-${suffix++}`);
    }
  }
}

function saveCommand(directory, name, command, args, result) {
  const stdoutName = `${name}.stdout`;
  const stderrName = `${name}.stderr.txt`;
  const stdout = outputBytes(result, "stdout");
  const stderr = outputBytes(result, "stderr");
  writeFileSync(join(directory, stdoutName), stdout);
  writeFileSync(join(directory, stderrName), stderr);
  return {
    command: [command, ...args].join(" "),
    exitCode: Number.isInteger(result?.status) ? result.status : null,
    error: result?.error ? String(result.error.message) : null,
    stdout: stdoutName,
    stderr: stderrName,
  };
}

function printRawReport(label, result) {
  process.stdout.write(`\n===== RAW ${label} (exit ${Number.isInteger(result?.status) ? result.status : "unknown"}) =====\n`);
  process.stdout.write(outputBytes(result, "stdout"));
  if (outputBytes(result, "stderr").length) {
    process.stderr.write(`\n===== RAW ${label} STDERR =====\n`);
    process.stderr.write(outputBytes(result, "stderr"));
  }
  process.stdout.write("\n===== END RAW REPORT =====\n");
}

export async function main() {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    process.stderr.write("audit:policy must run through npm so npm_execpath is defined.\n");
    return 2;
  }
  const evidenceDirectory = createEvidenceDirectory();
  const errors = [];
  const fullArgs = ["audit", "--json"];
  const productionJsonArgs = ["audit", "--omit=dev", "--json", "--audit-level=critical"];
  const productionHighArgs = ["audit", "--omit=dev", "--audit-level=high"];
  const fullResult = runNpm(npmCli, fullArgs);
  const productionJsonResult = runNpm(npmCli, productionJsonArgs);
  const productionHighResult = runNpm(npmCli, productionHighArgs);

  const commandEvidence = [
    saveCommand(evidenceDirectory, "npm-audit-full.json", "npm", fullArgs, fullResult),
    saveCommand(evidenceDirectory, "npm-audit-production.json", "npm", productionJsonArgs, productionJsonResult),
    saveCommand(evidenceDirectory, "npm-audit-production-high.txt", "npm", productionHighArgs, productionHighResult),
  ];
  writeFileSync(join(evidenceDirectory, "commands.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), commands: commandEvidence }, null, 2)}\n`, "utf8");

  printRawReport("npm audit --json", fullResult);
  printRawReport("npm audit --omit=dev --json --audit-level=critical", productionJsonResult);
  printRawReport("npm audit --omit=dev --audit-level=high", productionHighResult);

  for (const [label, result] of [["full npm audit", fullResult], ["production JSON audit", productionJsonResult], ["production high audit", productionHighResult]]) {
    if (result?.error) errors.push(`${label} could not complete: ${result.error.message}`);
    if (result?.signal) errors.push(`${label} was terminated by ${result.signal}.`);
  }
  if (![0, 1].includes(fullResult?.status)) errors.push(`Full npm audit returned unexpected exit ${fullResult?.status}.`);
  if (productionHighResult?.status !== 0) errors.push(`npm audit --omit=dev --audit-level=high failed (exit ${productionHighResult?.status}).`);

  const fullAudit = parseJsonOutput(fullResult, "npm audit --json", errors);
  const productionAudit = parseJsonOutput(productionJsonResult, "npm audit --omit=dev --json", errors);
  let policy;
  let lockfile;
  try {
    policy = JSON.parse(readFileSync(exceptionPath, "utf8"));
    lockfile = JSON.parse(readFileSync(lockfilePath, "utf8"));
  } catch (error) {
    errors.push(`Could not load exception policy or lockfile: ${error.message}`);
  }
  const evaluation = evaluateAuditPolicy({
    fullAudit,
    productionAudit,
    lockfile,
    policy,
    productionHighExitCode: productionHighResult?.status ?? null,
  });
  errors.push(...evaluation.errors);
  const resultDocument = {
    exceptionId: policy?.id ?? null,
    generatedAt: new Date().toISOString(),
    result: errors.length === 0 ? "PASS" : "FAIL",
    evidenceDirectory: evidenceDirectory.replace(`${repositoryRoot}\\`, "").replaceAll("\\", "/"),
    allowedFindingCount: evaluation.allowedFindingCount,
    fullAuditCounts: evaluation.fullAuditCounts,
    productionAuditCounts: evaluation.productionAuditCounts,
    errors: [...new Set(errors)],
  };
  writeFileSync(join(evidenceDirectory, "policy-result.json"), `${JSON.stringify(resultDocument, null, 2)}\n`, "utf8");
  process.stdout.write(`\naudit:policy ${resultDocument.result}; raw evidence: ${resultDocument.evidenceDirectory}\n`);
  for (const error of resultDocument.errors) process.stderr.write(`POLICY: ${error}\n`);
  return resultDocument.result === "PASS" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => { process.exitCode = code; }).catch((error) => {
    process.stderr.write(`audit:policy failed closed: ${error instanceof Error ? error.message : "unknown failure"}\n`);
    process.exitCode = 1;
  });
}

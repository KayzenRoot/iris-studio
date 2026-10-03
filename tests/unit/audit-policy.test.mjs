import { describe, expect, it } from "vitest";

import { collectAdvisoryIds, evaluateAuditPolicy } from "../../scripts/audit-policy.mjs";

const advisoryId = "GHSA-VFJ7-8CJW-P6XM";
const path = "root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8 > braces@3.0.3";

function fixture() {
  const lockfile = {
    packages: {
      "": { devDependencies: { "@next/eslint-plugin-next": "16.3.8" } },
      "node_modules/@next/eslint-plugin-next": { version: "16.3.8", dev: true, dependencies: { "fast-glob": "3.3.1" } },
      "node_modules/fast-glob": { version: "3.3.1", dev: true, dependencies: { micromatch: "4.0.8" } },
      "node_modules/micromatch": { version: "4.0.8", dev: true, dependencies: { braces: "3.0.3" } },
      "node_modules/braces": { version: "3.0.3", dev: true },
    },
  };
  const names = ["@next/eslint-plugin-next", "fast-glob", "micromatch", "braces"];
  const versions = ["16.3.8", "3.3.1", "4.0.8", "3.0.3"];
  const paths = [
    "root:devDependencies > @next/eslint-plugin-next@16.3.8",
    "root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1",
    "root:devDependencies > @next/eslint-plugin-next@16.3.8 > fast-glob@3.3.1 > micromatch@4.0.8",
    path,
  ];
  const nodes = [
    "node_modules/@next/eslint-plugin-next",
    "node_modules/fast-glob",
    "node_modules/micromatch",
    "node_modules/braces",
  ];
  const findings = names.map((packageName, index) => ({
    package: packageName,
    version: versions[index],
    severity: "high",
    advisoryId,
    scope: "dev-only",
    node: nodes[index],
    dependencyPath: paths[index],
    advisoryPath: path,
  }));
  const vulnerabilities = Object.fromEntries(names.map((packageName, index) => [packageName, {
    severity: "high",
    nodes: [nodes[index]],
    via: index === names.length - 1 ? [{ url: `https://github.com/advisories/${advisoryId}`, range: "<=3.0.3", severity: "high" }] : [names[index + 1]],
    fixAvailable: { name: "@next/eslint-plugin-next", version: "14.2.35", isSemVerMajor: true },
  }]));
  return {
    lockfile,
    policy: {
      id: "IRIS-STUDIO-SEC-0001",
      status: "ACTIVE",
      approvedOn: "2026-10-03",
      reviewDue: "2026-10-17",
      advisories: [{
        id: advisoryId,
        cve: "CVE-2026-93687",
        severity: "high",
        affectedPackage: "braces",
        affectedRange: "<=3.0.3",
        officialSource: `https://github.com/advisories/${advisoryId}`,
        officialFixedVersions: [],
        npmFixAvailableObserved: { name: "@next/eslint-plugin-next", version: "14.2.35", isSemVerMajor: true },
      }],
      findings,
      advisoryPaths: [{ advisoryId, nodes }],
    },
    fullAudit: {
      vulnerabilities,
      metadata: { vulnerabilities: { low: 0, moderate: 0, high: 4, critical: 0, total: 4 } },
    },
    productionAudit: {
      vulnerabilities: {},
      metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0, total: 0 } },
    },
  };
}

function evaluate(values, changes = {}) {
  return evaluateAuditPolicy({
    ...values,
    productionHighExitCode: 0,
    now: new Date("2026-10-03T15:00:00.000Z"),
    ...changes,
  });
}

describe("audit:policy", () => {
  it("maps the four dev-only package findings to their exact transitive GHSA and allows only the recorded major downgrade", () => {
    const values = fixture();
    expect(collectAdvisoryIds("@next/eslint-plugin-next", values.fullAudit.vulnerabilities)).toEqual([advisoryId]);
    const result = evaluate(values);
    expect(result.errors).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.allowedFindingCount).toBe(4);
  });

  it("fails any Critical even when it references the allowlisted advisory", () => {
    const values = fixture();
    values.fullAudit.vulnerabilities.braces.severity = "critical";
    expect(evaluate(values).errors.some((error) => error.includes("Critical vulnerability"))).toBe(true);
  });

  it("fails a High from an unregistered advisory", () => {
    const values = fixture();
    values.fullAudit.vulnerabilities.braces.via = [{ url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc", severity: "high" }];
    expect(evaluate(values).pass).toBe(false);
  });

  it("fails when the allowlisted advisory appears in the production tree, even at lower severity", () => {
    const values = fixture();
    values.productionAudit.vulnerabilities = {
      braces: {
        severity: "moderate",
        nodes: ["node_modules/braces"],
        via: [{ url: `https://github.com/advisories/${advisoryId}`, severity: "moderate" }],
      },
    };
    expect(evaluate(values).errors.some((error) => error.includes("appears in production"))).toBe(true);
  });

  it("fails when the exception is expired or exceeds the 14-day review window", () => {
    const values = fixture();
    expect(evaluate(values, { now: new Date("2026-10-17T00:00:00.000Z") }).errors.some((error) => error.includes("expired"))).toBe(true);
    values.policy.reviewDue = "2026-10-18";
    expect(evaluate(values).errors.some((error) => error.includes("within 14 days"))).toBe(true);
  });

  it("fails when a compatible npm fix becomes available", () => {
    const values = fixture();
    values.fullAudit.vulnerabilities.braces.fixAvailable = { name: "braces", version: "3.0.4", isSemVerMajor: false };
    expect(evaluate(values).errors.some((error) => error.includes("Compatible npm fix"))).toBe(true);
  });

  it("fails if a package version or exact dependency path changes", () => {
    const values = fixture();
    values.lockfile.packages["node_modules/braces"].version = "3.0.4";
    expect(evaluate(values).pass).toBe(false);
  });

  it("fails when the production audit command or policy identity fails", () => {
    const values = fixture();
    expect(evaluate(values, { productionHighExitCode: 1 }).errors.some((error) => error.includes("audit --omit=dev"))).toBe(true);
    values.policy.id = "OTHER";
    expect(evaluate(values).errors.some((error) => error.includes("missing or not ACTIVE"))).toBe(true);
  });
});

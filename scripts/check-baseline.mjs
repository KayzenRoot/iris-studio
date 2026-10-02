import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const errors = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(join(root, path), "utf8"));
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
    return null;
  }
}

const requiredFiles = [
  "README.md",
  "AGENTS.md",
  ".engineering/README.md",
  ".engineering/PROJECT-OVERVIEW.md",
  ".engineering/REQUIREMENTS.md",
  ".engineering/SCOPE.md",
  ".engineering/ARCHITECTURE.md",
  ".engineering/SECURITY.md",
  ".engineering/TEST-PLAN.md",
  ".engineering/DEPLOYMENT.md",
  ".engineering/BACKLOG.md",
  ".engineering/DEFINITION-OF-DONE.md",
  ".engineering/DECISIONS-LEDGER.md",
  ".engineering/CHECKPOINT.md",
  ".engineering/CHECKPOINT.json",
];

for (const path of requiredFiles) {
  if (!existsSync(join(root, path))) errors.push(`required source-pack file is missing: ${path}`);
}

const manifest = readJson("package.json");
const lock = readJson("package-lock.json");
const gefState = readJson(".gef/init-state.json");
const gefAdoptState = readJson(".gef/adopt-state.json");
const checkpoint = readJson(".engineering/CHECKPOINT.json");
const gefVersion = "1.1.2";

if (manifest) {
  if (manifest.name !== "iris-studio") errors.push("package.json name must be iris-studio");
  if (manifest.private !== true) errors.push("package.json must prevent accidental publication");
  if (manifest.packageManager !== "npm@11.17.0") errors.push("package.json must declare npm@11.17.0");
  if (manifest.devDependencies?.["@gef-bootstrap/cli"] !== gefVersion) {
    errors.push(`package.json must pin @gef-bootstrap/cli@${gefVersion}`);
  }
}

if (lock) {
  if (lock.lockfileVersion !== 3) errors.push("package-lock.json must use npm lockfile version 3");
  if (lock.packages?.["node_modules/@gef-bootstrap/cli"]?.version !== gefVersion) {
    errors.push(`package-lock.json must lock @gef-bootstrap/cli@${gefVersion}`);
  }
}

if (gefState?.kind !== "gef.init.state" || gefState?.productVersion !== gefVersion) {
  errors.push(`.gef/init-state.json must record successful GEF ${gefVersion} initialization`);
}

if (gefAdoptState?.kind !== "gef.adopt.state" || gefAdoptState?.productVersion !== gefVersion) {
  errors.push(`.gef/adopt-state.json must record the managed GEF ${gefVersion} foundation baseline`);
}

if (checkpoint?.schemaVersion !== 2 || checkpoint?.project !== "IRIS Studio") {
  errors.push(".engineering/CHECKPOINT.json must use the GEF-compatible schema and project identity");
}

const installedPackage = readJson("node_modules/@gef-bootstrap/cli/package.json");
if (installedPackage?.version !== gefVersion) {
  errors.push(`installed @gef-bootstrap/cli must be version ${gefVersion}`);
}

if (errors.length > 0) {
  console.error("Repository baseline check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Repository baseline check passed; GEF Bootstrap ${gefVersion} and ${requiredFiles.length} source-pack files verified.`);
}

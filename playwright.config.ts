import { defineConfig } from "@playwright/test";

const testDataDirectory = process.env.IRIS_DATA_DIR;
if (!testDataDirectory?.includes("iris-studio-e2e-")) {
  throw new Error("Execute os testes de navegador com npm run test:e2e para isolar e limpar os dados temporários.");
}
const testPort = Number(process.env.IRIS_TEST_PORT);
if (!Number.isInteger(testPort) || testPort < 1 || testPort > 65535) {
  throw new Error("A porta local do smoke test não foi configurada.");
}

const useDevelopmentServer = process.env.PLAYWRIGHT_DEV_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: useDevelopmentServer
      ? `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${testPort}`
      : `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${testPort}`,
    url: `http://127.0.0.1:${testPort}/projects/new`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      IRIS_DATA_DIR: testDataDirectory,
    },
  },
});

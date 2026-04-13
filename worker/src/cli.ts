import { runCollector } from "./index";

interface CliProcess {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
}

async function main(): Promise<void> {
  const nodeProcess = getNodeProcess();

  if (!nodeProcess) {
    console.error("collector CLI failed: process is unavailable");
    return;
  }

  const dataDir = resolveDataDir(nodeProcess.argv.slice(2), nodeProcess.env.DATA_DIR);

  if (!dataDir) {
    console.error("collector CLI failed: DATA_DIR is required");
    nodeProcess.exitCode = 1;
    return;
  }

  const result = await runCollector({ DATA_DIR: dataDir });

  if (!result.ok) {
    console.error("collector CLI failed", {
      errors: result.errors,
    });
    nodeProcess.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dataDir,
        changedCount: result.changedCount,
        recordCount: result.recordCount,
        currentProviders: Object.keys(result.current).length,
        historyCount: result.history.length,
      },
      null,
      2,
    ),
  );
}

function resolveDataDir(args: string[], envDataDir: string | undefined): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--data-dir") {
      return args[index + 1];
    }

    if (arg.startsWith("--data-dir=")) {
      return arg.slice("--data-dir=".length);
    }
  }

  return envDataDir;
}

function getNodeProcess(): CliProcess | undefined {
  return (globalThis as typeof globalThis & { process?: CliProcess }).process;
}

void main();

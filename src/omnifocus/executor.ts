import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config.js";
import { parseExecutorError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

const execFileAsync = promisify(execFile);

/**
 * Executes an OmniJS script inside OmniFocus via osascript JXA bridge.
 * Returns the raw stdout string.
 */
export async function runOmniJS(omniScript: string): Promise<string> {
  const jxaScript = `(() => {
  const app = Application("OmniFocus");
  return app.evaluateJavascript(${JSON.stringify(omniScript)});
})()`;

  logger.debug("Executing OmniJS script", { scriptLength: omniScript.length });

  try {
    const { stdout } = await execFileAsync("osascript", ["-l", "JavaScript", "-e", jxaScript], {
      timeout: config.executorTimeout,
      maxBuffer: config.maxBuffer,
    });

    return stdout.trim();
  } catch (error: unknown) {
    const execError = error as { stderr?: string; code?: number | null; killed?: boolean };
    const stderr = execError.stderr || "";
    const exitCode = execError.killed ? null : (execError.code ?? 1);

    logger.error("OmniJS execution failed", { stderr, exitCode });
    throw parseExecutorError(stderr, exitCode);
  }
}

/**
 * Executes an OmniJS script and parses the result as JSON.
 */
export async function runOmniJSJson<T>(omniScript: string): Promise<T> {
  const raw = await runOmniJS(omniScript);

  try {
    return JSON.parse(raw) as T;
  } catch {
    logger.error("Failed to parse OmniJS JSON response", { raw: raw.substring(0, 500) });
    throw new Error(`Failed to parse OmniFocus response as JSON: ${raw.substring(0, 200)}`);
  }
}

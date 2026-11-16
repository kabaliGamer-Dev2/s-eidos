#!/usr/bin/env node
/**
 * s-eidos — launcher.
 *
 * All behaviour lives in `src/cli/main.mjs`; this file only connects it to the real
 * process, so the same code can be exercised in-process by the test suite.
 */

import { CliExit, EXIT, main } from '../src/cli/main.mjs';

/** @type {import('../src/cli/main.mjs').CliIo} */
const io = {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
  cwd: process.cwd(),
  isTTY: process.stdout.isTTY === true,
  env: process.env,
};

try {
  process.exit(await main(process.argv.slice(2), io));
} catch (error) {
  if (error instanceof CliExit) {
    if (error.alreadyPrinted !== true) process.stderr.write(error.message);
    process.exit(error.code);
  }
  process.stderr.write(
    `s-eidos: unexpected failure: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(EXIT.findings);
}

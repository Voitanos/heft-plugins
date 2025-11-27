#!/usr/bin/env node
/**
 * Script to inject the Application Insights connection string into compiled output.
 *
 * Usage:
 *   node scripts/inject-connection-string.js
 *
 * The connection string is read from the APP_INSIGHTS_CONNECTION_STRING environment variable.
 * If not set, the script logs a warning but does not fail (allows local development).
 *
 * For local development with 1Password:
 *   op run --env-file=.env -- node scripts/inject-connection-string.js
 *
 * Or set the environment variable directly:
 *   APP_INSIGHTS_CONNECTION_STRING="InstrumentationKey=..." node scripts/inject-connection-string.js
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLACEHOLDER = '__APP_INSIGHTS_CONNECTION_STRING__';
const LIB_DIR = path.resolve(__dirname, '../lib');

/**
 * Recursively find all .js files in a directory
 */
function findJsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findJsFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Replace placeholder in a file
 */
function replaceInFile(filePath, connectionString) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (content.includes(PLACEHOLDER)) {
    const updated = content.replace(new RegExp(PLACEHOLDER, 'g'), connectionString);
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`  Updated: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }

  return false;
}

/**
 * Main function
 */
function main() {
  const connectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;

  console.log('Injecting Application Insights connection string...\n');

  if (!connectionString) {
    console.warn('WARNING: APP_INSIGHTS_CONNECTION_STRING environment variable is not set.');
    console.warn('Telemetry will be disabled at runtime.\n');
    console.warn('For local development with 1Password:');
    console.warn('  op run --env-file=.env -- node scripts/inject-connection-string.js\n');
    return;
  }

  if (!fs.existsSync(LIB_DIR)) {
    console.error('ERROR: lib/ directory not found. Run "heft build" first.');
    process.exit(1);
  }

  const jsFiles = findJsFiles(LIB_DIR);
  let updatedCount = 0;

  for (const file of jsFiles) {
    if (replaceInFile(file, connectionString)) {
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    console.log(`\nSuccessfully updated ${updatedCount} file(s).`);
  } else {
    console.log('No files contained the placeholder.');
  }
}

main();

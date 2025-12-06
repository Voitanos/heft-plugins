#!/usr/bin/env node
/**
 * Postinstall script to track plugin installations.
 *
 * This script runs automatically after the package is installed via npm/pnpm/yarn.
 * It sends a single telemetry event to track that the plugin was installed.
 *
 * Telemetry can be disabled by setting any of these environment variables:
 *   - HEFT_TELEMETRY_DISABLED=1
 *   - DISABLE_TELEMETRY=1
 *   - DO_NOT_TRACK=1
 *   - TELEMETRY_DISABLED=1
 *
 * In CI environments, you can also set SKIP_INSTALL_TELEMETRY=1 to skip this script.
 */

import { TelemetryClient, isTelemetryDisabled } from '@voitanos/heft-plugins-telemetry-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

// Get package info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, '../package.json');

async function trackInstallation() {
  // Skip if telemetry is disabled
  if (isTelemetryDisabled()) {
    return;
  }

  // Skip if explicitly disabled for installs (useful in CI during development)
  if (process.env.SKIP_INSTALL_TELEMETRY === '1') {
    return;
  }

  try {
    // Read package info
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const pluginName = packageJson.name;
    const pluginVersion = packageJson.version;

    // Create telemetry client
    const telemetry = new TelemetryClient({
      pluginName,
      pluginVersion,
    });

    // Track installation
    telemetry.trackPluginInstalled();

    // Flush with a short timeout (don't delay install too long)
    await Promise.race([
      telemetry.flush(),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // Silently ignore any errors - telemetry should never break installation
  }
}

// Run the tracking
trackInstallation().catch(() => {
  // Silently ignore - telemetry errors should never break installation
});

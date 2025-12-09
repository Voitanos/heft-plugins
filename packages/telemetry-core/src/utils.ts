/**
 * Utility functions for telemetry collection.
 *
 * @remarks
 * These utilities handle privacy controls, data sanitization, and system information gathering.
 */

import * as os from 'node:os';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ciInfo from 'ci-info';

/**
 * Environment variables that can be used to disable telemetry.
 */
const TELEMETRY_OPT_OUT_VARS = [
  'HEFT_TELEMETRY_DISABLED',
  'DISABLE_TELEMETRY',
  'DO_NOT_TRACK',
  'TELEMETRY_DISABLED',
] as const;

/**
 * Checks if telemetry collection is disabled via environment variables.
 *
 * @remarks
 * Respects multiple standard opt-out environment variables including
 * the `DO_NOT_TRACK` standard.
 *
 * @returns `true` if telemetry is disabled, `false` otherwise.
 */
export function isTelemetryDisabled(): boolean {
  for (const envVar of TELEMETRY_OPT_OUT_VARS) {
    const value = process.env[envVar];
    if (value === '1' || value?.toLowerCase() === 'true') {
      return true;
    }
  }
  return false;
}

/**
 * Regular expressions for sanitizing sensitive information from messages.
 * Order matters - more specific patterns (URLs) should come before general ones (paths).
 */
const SANITIZE_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  // URLs (must come before file paths to prevent partial matching)
  { pattern: /https?:\/\/[^\s]+/g, replacement: '[URL]' },
  // Email addresses
  { pattern: /[\w.-]+@[\w.-]+\.\w+/g, replacement: '[EMAIL]' },
  // IP addresses (IPv4)
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP]' },
  // UUIDs
  { pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, replacement: '[UUID]' },
  // File paths (Unix and Windows) - must come after URLs
  { pattern: /(?:\/[\w.-]+)+\/?/g, replacement: '[PATH]' },
  { pattern: /[A-Za-z]:\\(?:[\w.-]+\\)*/g, replacement: '[PATH]' },
];

/**
 * Sanitizes an error message by removing potentially sensitive information.
 *
 * @remarks
 * Removes file paths, email addresses, IP addresses, URLs, and UUIDs
 * to ensure no PII is transmitted in telemetry.
 *
 * @param message - The message to sanitize.
 * @returns The sanitized message with sensitive data replaced by tokens.
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  for (const { pattern, replacement } of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return truncateString(sanitized, 512);
}

/**
 * Truncates a string to the specified maximum length.
 *
 * @param str - The string to truncate.
 * @param maxLength - Maximum length (default: 1024).
 * @returns The truncated string with "..." appended if truncation occurred.
 */
export function truncateString(str: string, maxLength: number = 1024): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Gets the error type/category from an error object.
 *
 * @param error - The error to categorize.
 * @returns The error constructor name or "UnknownError".
 */
export function getErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.constructor.name;
  }
  return 'UnknownError';
}

/**
 * Gets the operating system type.
 *
 * @returns The OS platform (e.g., "linux", "darwin", "win32").
 */
export function getOsType(): string {
  return os.platform();
}

/**
 * Gets the operating system version.
 *
 * @returns The OS release version.
 */
export function getOsVersion(): string {
  return os.release();
}

/**
 * Gets the Node.js version.
 *
 * @returns The Node.js version without the "v" prefix.
 */
export function getNodeVersion(): string {
  return process.version.replace(/^v/, '');
}

/**
 * Detects if the code is running in a CI/CD environment.
 *
 * @remarks
 * Uses the `ci-info` package to detect CI environments.
 * Only returns a boolean - does not identify which CI platform.
 *
 * @returns `true` if running in CI, `false` otherwise.
 */
export function getIsCIEnvironment(): boolean {
  return ciInfo.isCI;
}

/**
 * Generates a random session ID for correlating telemetry events.
 *
 * @remarks
 * The session ID is a cryptographically random 32-character hex string.
 * It cannot be used to identify users across sessions.
 *
 * @returns A random 32-character hexadecimal session ID.
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Validates that a connection string appears to be a valid Azure Application Insights connection string.
 *
 * @remarks
 * Azure Application Insights connection strings typically contain an InstrumentationKey
 * and/or an IngestionEndpoint. This function checks for the presence of these markers
 * rather than checking for placeholder values, which avoids issues with build-time
 * string replacement.
 *
 * @param connectionString - The connection string to validate.
 * @returns `true` if the connection string appears valid, `false` otherwise.
 */
export function isValidConnectionString(connectionString: string): boolean {
  if (!connectionString || typeof connectionString !== 'string') {
    return false;
  }

  // Azure Application Insights connection strings contain either:
  // - InstrumentationKey=<guid>
  // - IngestionEndpoint=<url>
  // A valid connection string should have at least one of these
  return (
    connectionString.includes('InstrumentationKey=') ||
    connectionString.includes('IngestionEndpoint=')
  );
}

/**
 * Cached telemetry client version to avoid repeated file reads.
 */
let cachedTelemetryClientVersion: string | undefined;

/**
 * Gets the version of the telemetry-core package.
 *
 * @remarks
 * Reads the version from the package.json file. The version is cached
 * after the first read to avoid repeated file system operations.
 *
 * @returns The package version string, or "unknown" if it cannot be determined.
 */
export function getTelemetryClientVersion(): string {
  if (cachedTelemetryClientVersion !== undefined) {
    return cachedTelemetryClientVersion;
  }

  try {
    // Try to find package.json by resolving the package name
    // This works in both ESM and CommonJS contexts
    const packageJsonPath = require.resolve('@voitanos/heft-plugins-telemetry-core/package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    cachedTelemetryClientVersion = packageJson.version || 'unknown';
  } catch {
    cachedTelemetryClientVersion = 'unknown';
  }

  return cachedTelemetryClientVersion as string;
}

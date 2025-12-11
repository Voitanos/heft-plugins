# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Overview

**Package:** `@voitanos/heft-plugins-telemetry-core`
**Current Version:** 0.1.0-beta.3
**Purpose:** A privacy-focused telemetry client library for @voitanos Heft plugins using Azure Application Insights.

This package provides a shared telemetry infrastructure that:
- Collects anonymous usage and performance data
- Automatically sanitizes all data to remove PII
- Respects user opt-out preferences via environment variables
- Uses build-time injection for the App Insights connection string

## Package Architecture

### Core Components

1. **TelemetryClient.ts** - Main telemetry client
   - Manages Azure Application Insights integration
   - Tracks plugin lifecycle events (installed, started, completed, error, warning)
   - Validates connection string format at runtime
   - Auto-disables if telemetry is opted out or connection string is invalid

2. **types.ts** - TypeScript type definitions
   - `TelemetryConfig` - Client configuration options
   - `TelemetryContext` - Non-identifying system context
   - `TelemetryEventType` enum - Event types (Installed, Started, Completed, Error, Warning)
   - `PluginOutcome` enum - Execution outcomes (Success, Warning, Error)
   - Event interfaces for each telemetry event type

3. **utils.ts** - Utility functions
   - `isTelemetryDisabled()` - Checks opt-out environment variables
   - `sanitizeErrorMessage()` - Removes PII from error messages
   - `isValidConnectionString()` - Validates App Insights connection string format
   - `generateSessionId()` - Creates random session identifiers
   - System info helpers (OS type, version, Node version, CI detection)

4. **index.ts** - Public API exports
   - Exports `TelemetryClient` class
   - Exports all types and enums
   - Exports selected utility functions for advanced use

### Build-Time Connection String Injection

The package uses a placeholder-based injection system:

1. **Source code** contains placeholder: `__HEFT_PLUGINS_APP_INSIGHTS_CONNECTION_STRING__`
2. **Build script** (`scripts/inject-connection-string.js`) replaces placeholder with real connection string
3. **Runtime validation** checks connection string format (must contain `InstrumentationKey=` or `IngestionEndpoint=`)

**Key files:**
- [TelemetryClient.ts:46](src/TelemetryClient.ts:46) - Placeholder constant
- [scripts/inject-connection-string.js](scripts/inject-connection-string.js) - Injection script
- [utils.ts:171](src/utils.ts:171) - `isValidConnectionString()` validation

### Privacy Features

The package is designed to be privacy-safe:

- **Opt-out support**: Respects `HEFT_TELEMETRY_DISABLED`, `DO_NOT_TRACK`, `DISABLE_TELEMETRY`, `TELEMETRY_DISABLED`
- **PII sanitization**: File paths, emails, IPs, URLs, UUIDs are stripped from messages
- **No user identification**: Session IDs are random per execution, not persistent
- **CI detection**: Only detects if CI (boolean), not which platform

See [PRIVACY.md](PRIVACY.md) for complete privacy documentation.

## Project Structure

```
telemetry-core/
├── src/
│   ├── index.ts              # Public API exports
│   ├── TelemetryClient.ts    # Main client implementation
│   ├── types.ts              # TypeScript types and enums
│   ├── utils.ts              # Utility functions
│   └── utils.spec.ts         # Unit tests
├── scripts/
│   └── inject-connection-string.js  # Build-time injection script
├── lib/                      # Compiled output (git-ignored)
├── config/
│   └── heft.json             # Heft configuration
├── PRIVACY.md                # Privacy documentation
├── package.json
└── tsconfig.json
```

## Build Configuration

### Heft Build Phases

**Build Phase:**
- **typescript** task - Compiles TypeScript to ESM

**Test Phase:**
- **jest** task - Runs tests with Jest

### TypeScript Configuration

- **Module:** ESNext (ESM)
- **Target:** ES2020
- **Output:** `lib/` directory
- **Strict mode:** Enabled
- **Declaration maps:** Generated for debugging

## Common Commands

```console
# Build package
heft build --clean

# Build (incremental)
heft build

# Run tests
heft test --clean

# Build with connection string injection (requires 1Password CLI)
npm run build:inject

# Run specific test
npx jest src/utils.spec.ts
```

## Development Guidelines

### Adding New Telemetry Events

1. Add event type to `TelemetryEventType` enum in [types.ts](src/types.ts:83)
2. Create event interface extending `TelemetryEventBase` in [types.ts](src/types.ts)
3. Add union member to `TelemetryEvent` type in [types.ts](src/types.ts:204)
4. Implement tracking method in `TelemetryClient` class
5. Add tests for the new event type

### Adding New Privacy Sanitization

1. Add pattern to `SANITIZE_PATTERNS` array in [utils.ts](src/utils.ts:45)
2. Order matters - more specific patterns should come before general ones
3. Add tests for the new sanitization pattern

### Modifying Connection String Validation

The `isValidConnectionString()` function in [utils.ts](src/utils.ts:171) validates connection strings by checking for `InstrumentationKey=` or `IngestionEndpoint=` markers. This approach:
- Avoids placeholder detection issues (build-time replacement affects all strings)
- Validates actual connection string format
- Is immune to the injection script's string replacement

## Dependencies

**Runtime Dependencies:**
- `applicationinsights@^2.9.5` - Azure Application Insights SDK
- `ci-info@^4.0.0` - CI/CD environment detection

**Dev Dependencies:**
- `@rushstack/heft@~1.1.5` - Heft build system
- `@rushstack/heft-jest-plugin@~1.1.5` - Jest integration
- `@rushstack/heft-typescript-plugin@~1.1.5` - TypeScript compilation
- `typescript@~5.7.2` - TypeScript compiler
- `jest@^29.7.0` - Testing framework
- `ts-jest@^29.2.0` - Jest TypeScript transformer

## Package Publishing

This package uses independent versioning and is published via GitHub Actions.

**Publishing a new version:**
1. Update version in [package.json](package.json:4)
2. Commit: `git commit -m "chore: bump version to X.Y.Z"`
3. Tag: `git tag telemetry-core@vX.Y.Z`
4. Push: `git push origin main && git push origin telemetry-core@vX.Y.Z`

**Pre-release versions:**
- Use format: `X.Y.Z-beta.N`, `X.Y.Z-rc.N`, or `X.Y.Z-alpha.N`
- Automatically published to `@next` NPM tag

**Stable versions:**
- Use format: `X.Y.Z`
- Automatically published to `@latest` NPM tag

**CI/CD Injection:**
The GitHub Actions workflow automatically:
1. Injects the connection string from `vars.HEFT_PLUGINS_APP_INSIGHTS_CONNECTION_STRING`
2. Validates the injection succeeded (placeholder replaced, valid format)
3. Publishes to NPM

## Usage by Plugins

Plugins consume this package as follows:

```typescript
import { TelemetryClient, PluginOutcome } from '@voitanos/heft-plugins-telemetry-core';

const telemetry = new TelemetryClient({
  pluginName: '@voitanos/heft-my-plugin',
  pluginVersion: '1.0.0',
});

telemetry.trackPluginStarted();
try {
  // ... plugin work ...
  telemetry.trackPluginCompleted(duration, PluginOutcome.Success, 0);
} catch (error) {
  telemetry.trackPluginError(error, duration);
  throw error;
} finally {
  await telemetry.flush();
}
```

## Important Implementation Notes

1. **Connection string is NOT passed by plugins** - It's baked into the package at build time
2. **Telemetry fails silently** - All telemetry errors are caught and ignored
3. **Flush has timeout** - The `flush()` method has a 2-second timeout to prevent blocking
4. **App Insights auto-collection** - Some auto-collection is enabled (performance, exceptions, dependencies)

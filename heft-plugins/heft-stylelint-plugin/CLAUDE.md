# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plugin Overview

**Package:** `@voitanos/heft-stylelint-plugin`
**Current Version:** 0.1.0-beta.5
**Purpose:** A Heft plugin that integrates Stylelint into the Heft build system for linting CSS, SCSS, and Sass files.

This plugin runs Stylelint during the Heft build process, reporting style violations as warnings in the build output.

## Plugin Architecture

### Core Components

1. **StylelintPlugin.ts** - Main plugin implementation
   - Implements `IHeftTaskPlugin<IStylelintPluginOptions>`
   - Registers with Heft's run hook at earliest stage (`Number.MIN_SAFE_INTEGER`)
   - Runs Stylelint via Node.js API
   - Formats and outputs violations as warnings

2. **index.ts** - Plugin entry point
   - Exports plugin class as default export (required by Heft)
   - Exports `PLUGIN_NAME` constant and `IStylelintPluginOptions` interface

3. **heft-plugin.json** - Plugin manifest
   - Declares plugin name, entry point, and options schema
   - Located at package root (required by Heft)

4. **schemas/heft-stylelint-plugin.schema.json** - Options schema
   - JSON Schema for plugin configuration
   - Currently accepts no options (empty schema)
   - Copied to `lib/schemas/` during build

### Plugin Execution Flow

```
Heft Build → Run Hook (MIN_SAFE_INTEGER stage) → StylelintPlugin
  ↓
  1. Read Stylelint version from node_modules
  2. Output version to terminal
  3. Run stylelint.lint() on src/**/*.scss
  4. Parse results for warnings/errors
  5. Format and output each violation to terminal
```

### Key Implementation Details

**Stylelint Configuration:**
- Looks for `.stylelintrc` in `heftConfiguration.buildFolderPath`
- Currently hardcoded to lint `src/**/*.scss` files
- Uses Stylelint's Node.js API (not CLI)

**Output Formatting:**
- Violations formatted as: `path:line:column - (rule) message`
- All violations are output as warnings (not errors)
- Uses `taskSession.logger.terminal.writeWarningLine()`

**Hook Priority:**
- Uses `Number.MIN_SAFE_INTEGER` stage priority
- Ensures Stylelint runs before other plugins (like TypeScript compilation)

## Project Structure

```
heft-stylelint-plugin/
├── src/
│   ├── index.ts                    # Plugin entry point
│   ├── StylelintPlugin.ts          # Main implementation
│   ├── StylelintPlugin.spec.ts     # Unit tests
│   └── schemas/
│       └── heft-stylelint-plugin.schema.json  # Options schema
├── lib/                            # Compiled output (git-ignored)
│   ├── index.js
│   ├── index.d.ts
│   ├── StylelintPlugin.js
│   ├── StylelintPlugin.d.ts
│   └── schemas/                    # Schema copied during build
├── config/
│   ├── heft.json                   # Heft configuration
│   └── jest.config.json            # Jest configuration
├── heft-plugin.json                # Plugin manifest
├── package.json
└── tsconfig.json
```

## Build Configuration

### Heft Build Phases

**Build Phase:**
1. **typescript** task - Compiles TypeScript to ESM
2. **copy-json-schema** task - Copies schema files to `lib/schemas/`

**Test Phase:**
1. **jest** task - Runs tests with Jest

### TypeScript Configuration

- **Module:** ESNext (ESM)
- **Target:** ES2020
- **Output:** `lib/` directory
- **Strict mode:** Enabled
- **Declaration maps:** Generated for debugging

### Jest Configuration

- **Test Pattern:** `src/**/*.spec.ts`
- **Transform:** ts-jest with ESM support
- **Module Mapping:** Maps `.js` imports to `.ts` files for testing
- **Coverage Threshold:** 50% (branches, functions, lines, statements)

## Common Commands

```console
# Build plugin
heft build --clean

# Build (incremental)
heft build

# Run tests
heft test --clean

# Run tests in watch mode
heft test --watch

# Watch mode for development
heft build-watch

# Run specific test
npx jest src/StylelintPlugin.spec.ts

# Run tests with coverage
heft test --clean --coverage
```

## Development Guidelines

### Adding New Configuration Options

1. Update `IStylelintPluginOptions` interface in [StylelintPlugin.ts](src/StylelintPlugin.ts:14)
2. Update JSON schema in [src/schemas/heft-stylelint-plugin.schema.json](src/schemas/heft-stylelint-plugin.schema.json)
3. Use options in `apply()` method via the `options` parameter
4. Update tests to cover new options

### Modifying Stylelint Behavior

Current hardcoded values that may need to be configurable:
- File pattern: `src/**/*.scss` ([StylelintPlugin.ts:32](src/StylelintPlugin.ts:32))
- Config file location: `.stylelintrc` ([StylelintPlugin.ts:33](src/StylelintPlugin.ts:33))
- Working directory: `heftConfiguration.buildFolderPath`

To make these configurable:
1. Add properties to `IStylelintPluginOptions`
2. Update schema with default values
3. Use option values in `stylelint.lint()` call

### Testing Approach

**Unit Tests:**
- Mock `IHeftTaskSession` and `HeftConfiguration`
- Test hook registration (name, stage priority)
- Test plugin instantiation

**Integration Testing:**
- Currently no integration tests
- Consider adding tests that run actual Stylelint on sample files

## Dependencies

**Runtime Dependencies:**
- `stylelint@16.25.0` - Core Stylelint engine
- `stylelint-config-standard-scss@16.0.0` - Standard SCSS configuration

**Peer Dependencies:**
- `@rushstack/heft@>=1.0.0 <2.0.0` - Heft build system

**Dev Dependencies:**
- `@rushstack/heft@~1.1.5` - Heft core
- `@rushstack/heft-jest-plugin@~1.1.5` - Jest integration
- `@rushstack/heft-typescript-plugin@~0.4.0` - TypeScript compilation
- `typescript@~5.7.2` - TypeScript compiler
- `jest@^29.7.0` - Testing framework
- `ts-jest@^29.2.0` - Jest TypeScript transformer

## Package Publishing

This plugin uses independent versioning and is published via GitHub Actions.

**Publishing a new version:**
1. Update version in [package.json](package.json:4)
2. Commit: `git commit -m "chore: bump version to X.Y.Z"`
3. Tag: `git tag heft-stylelint-plugin@vX.Y.Z`
4. Push: `git push origin main && git push origin heft-stylelint-plugin@vX.Y.Z`

**Pre-release versions:**
- Use format: `X.Y.Z-beta.N`, `X.Y.Z-rc.N`, or `X.Y.Z-alpha.N`
- Automatically published to `@next` NPM tag

**Stable versions:**
- Use format: `X.Y.Z`
- Automatically published to `@latest` NPM tag

See [AUTOMATION.md](../../../AUTOMATION.md) for complete publishing documentation.

## Known Limitations

1. File pattern is hardcoded to `src/**/*.scss`
2. Config file location is hardcoded to `.stylelintrc`
3. All violations are reported as warnings (not errors)
4. No option to fail build on violations
5. No support for auto-fixing violations
6. Limited test coverage (only unit tests, no integration tests)

## Future Enhancements

Potential improvements to consider:
- Make file patterns configurable
- Add support for multiple config file formats (.stylelintrc.json, .js, etc.)
- Add option to fail build on violations
- Add support for Stylelint auto-fix
- Make violation severity configurable (warning vs error)
- Add integration tests with real Stylelint execution
- Support for custom Stylelint formatters

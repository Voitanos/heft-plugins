# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Package:** `spfx-react-webpart`
**Purpose:** Test project for validating Heft plugins during local development. This is a SharePoint Framework (SPFx) React web part project used to test `@voitanos/heft-stylelint-plugin` and other plugins.

**Important:** This project is NOT published to npm (`"private": true`, `"shouldPublish": false` in rush.json).

## Local Development Workflow

This project exists to test local plugin changes without publishing to npm.

### How Rush Linking Works

This repo uses pnpm workspaces (`useWorkspaces: true` in `common/config/rush/pnpm-config.json`).

When you run `rush update`, pnpm creates direct symlinks to local packages:
- `@voitanos/heft-stylelint-plugin` symlinks to `../../heft-plugins/heft-stylelint-plugin`
- `@voitanos/heft-plugins-telemetry-core` symlinks to `../../packages/telemetry-core`

The `package.json` uses `"workspace:*"` for local plugins, which forces pnpm to use the local workspace version (never fetching from npm).

### Development Cycle

1. Make changes to a plugin (e.g., `heft-stylelint-plugin`)
2. Build the plugin: `cd heft-plugins/heft-stylelint-plugin && heft build --clean`
3. Test in this project: `cd test-projects/spfx-react-webpart && heft build --clean`

Or from repo root:

```bash
rush build  # Builds all projects including plugins and test project
```

## Project Structure

```
spfx-react-webpart/
├── src/
│   └── webparts/           # SPFx web part source
├── config/
│   ├── heft.json           # Heft config (references plugins)
│   └── ...                 # Other SPFx config files
├── package.json            # Dependencies including local plugins
└── tsconfig.json
```

## Heft Configuration

The `config/heft.json` extends SPFx's default Heft rig and adds custom plugin tasks:

```json
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/heft.json",
  "phasesByName": {
    "build": {
      "tasksByName": {
        "stylelint-plugin": {
          "taskDependencies": ["sass"],
          "taskPlugin": {
            "pluginPackage": "@voitanos/heft-stylelint-plugin"
          }
        }
      }
    }
  }
}
```

## Common Commands

```bash
# Build the project (runs all Heft plugins)
heft build --clean

# Build for production
heft test --clean --production && heft package-solution --production

# Start dev server
heft start --clean

# Clean build outputs
heft clean
```

## Testing New Plugins

To test a new plugin in this project:

1. Add the plugin package to `devDependencies` in `package.json`:
   ```json
   "@voitanos/new-plugin": "workspace:*"
   ```

2. Run `rush update` from repo root
3. Configure the plugin in `config/heft.json`
4. Run `heft build --clean` to test

## Troubleshooting

### Changes to plugin not reflected

After modifying a plugin, rebuild it before testing:

```bash
cd heft-plugins/[plugin-name]
heft build --clean
cd ../../test-projects/spfx-react-webpart
heft build --clean
```

Or use `rush build` from repo root to build everything.

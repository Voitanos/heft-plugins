# Privacy & Telemetry Information

This document explains what telemetry data is collected by @voitanos Heft plugins and how to disable it.

## Overview

The @voitanos Heft plugins collect anonymous usage and performance data to help improve the tools. **No personal information, file paths, or project details are collected.**

## What We Collect

### Context Information

- **Operating System**: Type (linux, darwin, win32) and version
- **Node.js Version**: Runtime version number
- **CI/CD Detection**: Boolean flag indicating if running in CI (not which platform)
- **Session ID**: Random identifier for the current execution (not persistent)
- **Plugin Version**: Version of the plugin being used

### Event Data

- **Installation Events**: When a plugin is installed
- **Execution Events**: Start time, completion time, duration
- **Outcome**: Success, warning, or error status
- **Warning/Error Counts**: Number of issues encountered
- **Sanitized Error Messages**: Error messages with paths and PII removed

## What We Do NOT Collect

We have specifically designed the system to **avoid** collecting:

- User names or machine names
- File paths or project names
- Company or organization information
- Repository URLs or Git information
- Email addresses or IP addresses
- Source code or file contents
- Environment variable values
- Any personally identifiable information (PII)

## Data Sanitization

All error and warning messages are automatically sanitized before transmission:

- File paths are replaced with `[PATH]`
- Email addresses are replaced with `[EMAIL]`
- IP addresses are replaced with `[IP]`
- URLs are replaced with `[URL]`
- UUIDs are replaced with `[UUID]`

## Disabling Telemetry

You can disable telemetry collection by setting any of the following environment variables:

```bash
# Any of these will disable telemetry
export HEFT_TELEMETRY_DISABLED=1
export DISABLE_TELEMETRY=1
export DO_NOT_TRACK=1
export TELEMETRY_DISABLED=1
```

The plugins respect the `DO_NOT_TRACK` standard (https://consented.tech/do-not-track/).

## Data Storage & Retention

- Data is stored in Azure Application Insights
- Retention period: 90 days
- Access is restricted to the @voitanos maintainers
- Data is never sold or shared with third parties

## Why We Collect Telemetry

Telemetry helps us:

1. **Understand usage patterns** - Which plugins are used most
2. **Identify issues** - Common errors and warnings
3. **Improve performance** - Identify slow operations
4. **Prioritize development** - Focus on what matters most

## Questions or Concerns

If you have questions about telemetry or privacy, please open an issue at:
https://github.com/Voitanos/heft-plugins/issues

## Changes to This Policy

This privacy policy may be updated from time to time. Changes will be documented in the repository's changelog.

---

Last Updated: 2025

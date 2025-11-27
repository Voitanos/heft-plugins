import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import type {
  HeftConfiguration,
  IHeftTaskSession,
  IHeftTaskPlugin,
} from '@rushstack/heft';
import stylelint from 'stylelint';
import { TelemetryClient, PluginOutcome } from '@voitanos/heft-plugins-telemetry-core';

export const PLUGIN_NAME: 'stylelint-plugin' = 'stylelint-plugin';
const PACKAGE_NAME = '@voitanos/heft-stylelint-plugin';

/**
 * Get the package version for telemetry.
 * Note: This reads from package.json at runtime to get the actual deployed version.
 */
function getPackageVersion(buildFolderPath: string): string {
  try {
    // When installed as a dependency, the package.json will be in the package root
    const packageJsonPath = path.resolve(buildFolderPath, 'node_modules', PACKAGE_NAME, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    // Fallback: return a default version if package.json can't be read
    return '0.0.0-unknown';
  }
}

export interface IStylelintPluginOptions { }

export default class StylelintPlugin implements IHeftTaskPlugin<IStylelintPluginOptions> {
  private _telemetry: TelemetryClient | undefined;

  public apply(taskSession: IHeftTaskSession, heftConfiguration: HeftConfiguration, options: IStylelintPluginOptions): void {
    taskSession.hooks.run.tapPromise({
      name: PLUGIN_NAME,
      stage: Number.MIN_SAFE_INTEGER
    }, async () => {
      const startTime = Date.now();
      let warningCount = 0;

      // Initialize telemetry lazily (needs buildFolderPath for version detection)
      if (!this._telemetry) {
        this._telemetry = new TelemetryClient({
          pluginName: PACKAGE_NAME,
          pluginVersion: getPackageVersion(heftConfiguration.buildFolderPath),
        });
      }

      // Track plugin start
      this._telemetry.trackPluginStarted();

      try {
        // output version of stylelint
        const stylelintPkgPath = path.join(heftConfiguration.buildFolderPath, 'node_modules/stylelint/package.json');
        const stylelintPkg = JSON.parse(readFileSync(stylelintPkgPath, 'utf-8'));
        taskSession.logger.terminal.writeLine(`Using Stylelint version ${stylelintPkg.version}`)
        if (taskSession.parameters.verbose) {
          taskSession.logger.terminal.writeVerboseLine(`path ${heftConfiguration.buildFolderPath}`)
        }

        // run stylelint on SCSS & CSS files using Node.js API
        if (taskSession.parameters.verbose) {
          taskSession.logger.terminal.writeVerboseLine('linting...');
        }
        const result = await stylelint.lint({
          files: 'src/**/*.scss',
          configFile: path.join(heftConfiguration.buildFolderPath, '.stylelintrc'),
          cwd: heftConfiguration.buildFolderPath
        });

        if (taskSession.parameters.verbose) {
          taskSession.logger.terminal.writeVerboseLine(`results: ${JSON.stringify(result)}`);
        }

        // process results
        if (result.errored || result.results.some(r => r.warnings.length > 0)) {
          for (const fileResult of result.results) {
            if (fileResult.warnings.length > 0 && fileResult.source) {
              for (const warning of fileResult.warnings) {
                warningCount++;
                const relativePath = path.relative(heftConfiguration.buildFolderPath, fileResult.source);
                const formattedWarning = `${relativePath}:${warning.line}:${warning.column} - (${warning.rule}) ${warning.text}`;
                taskSession.logger.terminal.writeWarningLine(formattedWarning);

                // Track warning (category is the stylelint rule)
                this._telemetry.trackPluginWarning(
                  warning.rule || 'unknown',
                  `Stylelint warning: ${warning.text}`
                );
              }
            }
          }
        }

        // Track successful completion
        const duration = Date.now() - startTime;
        const outcome = warningCount > 0 ? PluginOutcome.Warning : PluginOutcome.Success;
        this._telemetry.trackPluginCompleted(duration, outcome, warningCount);

      } catch (error) {
        // Track error
        const duration = Date.now() - startTime;
        this._telemetry.trackPluginError(error, duration);
        this._telemetry.trackPluginCompleted(duration, PluginOutcome.Error, warningCount);
        throw error;

      } finally {
        // Flush telemetry with timeout to avoid blocking
        await Promise.race([
          this._telemetry.flush(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]).catch(() => {
          // Silently ignore flush errors
        });
      }
    });
  }
}

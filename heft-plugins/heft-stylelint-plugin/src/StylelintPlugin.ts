import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import type {
  HeftConfiguration,
  IHeftTaskSession,
  IHeftTaskPlugin,
  IHeftTaskRunHookOptions,
  IScopedLogger
} from '@rushstack/heft';
import stylelint from 'stylelint';

export const PLUGIN_NAME: 'stylelint-plugin' = 'stylelint-plugin';

export interface IStylelintPluginOptions { }

export default class StylelintPlugin implements IHeftTaskPlugin<IStylelintPluginOptions> {

  public apply(taskSession: IHeftTaskSession, heftConfiguration: HeftConfiguration, options: IStylelintPluginOptions): void {
    taskSession.hooks.run.tapPromise({
      name: PLUGIN_NAME,
      stage: Number.MIN_SAFE_INTEGER
    }, async () => {
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
              const relativePath = path.relative(heftConfiguration.buildFolderPath, fileResult.source);
              const formattedWarning = `${relativePath}:${warning.line}:${warning.column} - (${warning.rule}) ${warning.text}`;
              taskSession.logger.terminal.writeWarningLine(formattedWarning);
            }
          }
        }
      }
    });
  }
}

/**
 * TelemetryClient for @voitanos Heft plugins.
 *
 * @remarks
 * This client provides privacy-focused telemetry collection using Azure Application Insights.
 * It automatically sanitizes data to remove PII and respects user opt-out preferences.
 */

import appInsights from 'applicationinsights';
import type { TelemetryClient as AppInsightsTelemetryClient } from 'applicationinsights';

import type {
  TelemetryConfig,
  TelemetryContext,
} from './types.js';
import {
  TelemetryEventType,
  PluginOutcome,
} from './types.js';
import {
  isTelemetryDisabled,
  sanitizeErrorMessage,
  getErrorType,
  getOsType,
  getOsVersion,
  getNodeVersion,
  getIsCIEnvironment,
  generateSessionId,
  truncateString,
  isValidConnectionString,
} from './utils.js';

/**
 * Default connection string placeholder.
 *
 * @remarks
 * This placeholder is replaced during the CI/CD build process with the actual
 * Azure Application Insights connection string. The replacement happens via
 * the `inject-connection-string.js` script before publishing.
 *
 * At runtime, the `isValidConnectionString()` function validates that the
 * connection string looks like a real App Insights connection string (contains
 * InstrumentationKey= or IngestionEndpoint=), which will fail if this placeholder
 * was not replaced.
 */
const DEFAULT_CONNECTION_STRING = '__HEFT_PLUGINS_APP_INSIGHTS_CONNECTION_STRING__';

/**
 * TelemetryClient for tracking plugin usage and performance.
 *
 * @remarks
 * This client is designed to be instantiated once per plugin execution.
 * It automatically:
 * - Checks for opt-out environment variables
 * - Generates a unique session ID
 * - Collects non-identifying system context
 * - Sanitizes all error messages before transmission
 *
 * @example
 * ```typescript
 * const telemetry = new TelemetryClient({
 *   pluginName: '@voitanos/heft-stylelint-plugin',
 *   pluginVersion: '1.0.0',
 * });
 *
 * telemetry.trackPluginStarted();
 * try {
 *   // ... plugin work ...
 *   telemetry.trackPluginCompleted(duration, PluginOutcome.Success, 0);
 * } catch (error) {
 *   telemetry.trackPluginError(error, duration);
 *   throw error;
 * } finally {
 *   await telemetry.flush();
 * }
 * ```
 */
export class TelemetryClient {
  private readonly _client: AppInsightsTelemetryClient | undefined;
  private readonly _context: TelemetryContext;
  private readonly _enabled: boolean;

  /**
   * Creates a new TelemetryClient instance.
   *
   * @param config - Configuration options for the client.
   */
  constructor(config: Omit<TelemetryConfig, 'connectionString'> & { connectionString?: string }) {
    // Determine if telemetry is enabled
    this._enabled = !isTelemetryDisabled();

    // Build context (always, for potential debugging)
    this._context = {
      osType: getOsType(),
      osVersion: getOsVersion(),
      nodeVersion: getNodeVersion(),
      isCI: getIsCIEnvironment(),
      sessionId: generateSessionId(),
      pluginName: config.pluginName,
      pluginVersion: config.pluginVersion,
    };

    // Only initialize App Insights if telemetry is enabled
    if (this._enabled) {
      const connectionString = this._getConnectionString(config.connectionString);

      // Check if we have a valid connection string format
      // This validates the string looks like an App Insights connection string
      // rather than checking for placeholder values (which would be replaced at build time)
      if (!isValidConnectionString(connectionString)) {
        this._enabled = false;
        return;
      }

      try {
        // Configure Application Insights
        appInsights
          .setup(connectionString)
          .setAutoCollectRequests(false)
          .setAutoCollectPerformance(true)
          .setAutoCollectExceptions(true)
          .setAutoCollectDependencies(true)
          .setAutoCollectConsole(false)
          .setAutoCollectPreAggregatedMetrics(true)
          .setAutoDependencyCorrelation(true)
          .setSendLiveMetrics(true)
          .start();

        this._client = appInsights.defaultClient;

        // Add telemetry initializer to enrich all events with context
        this._client.addTelemetryProcessor((envelope) => {
          if (envelope.data?.baseData?.properties) {
            envelope.data.baseData.properties = {
              ...envelope.data.baseData.properties,
              ...this._getContextProperties(),
            };
          }
          return true;
        });
      } catch {
        // If App Insights fails to initialize, disable telemetry silently
        this._enabled = false;
      }
    }
  }

  /**
   * Gets the connection string from config, environment, or default.
   */
  private _getConnectionString(configConnectionString?: string): string {
    // Priority: config > environment > default
    return (
      configConnectionString ||
      process.env.HEFT_PLUGINS_APP_INSIGHTS_CONNECTION_STRING ||
      DEFAULT_CONNECTION_STRING
    );
  }

  /**
   * Converts context to properties object for telemetry events.
   */
  private _getContextProperties(): Record<string, string> {
    return {
      pluginName: this._context.pluginName,
      pluginVersion: this._context.pluginVersion,
      osType: this._context.osType,
      osVersion: this._context.osVersion,
      nodeVersion: this._context.nodeVersion,
      isCI: String(this._context.isCI),
      sessionId: this._context.sessionId,
    };
  }

  /**
   * Checks if telemetry collection is enabled.
   *
   * @returns `true` if telemetry is enabled and will be sent, `false` otherwise.
   */
  public isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Gets the current telemetry context.
   *
   * @remarks
   * Useful for debugging or logging the session ID.
   *
   * @returns The telemetry context object.
   */
  public getContext(): TelemetryContext {
    return { ...this._context };
  }

  /**
   * Tracks a plugin installation event.
   *
   * @remarks
   * Call this from a postinstall script to track when the plugin is installed.
   */
  public trackPluginInstalled(): void {
    if (!this._enabled || !this._client) return;

    try {
      this._client.trackEvent({
        name: TelemetryEventType.Installed,
        properties: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Silently ignore telemetry errors
    }
  }

  /**
   * Tracks a plugin execution start event.
   */
  public trackPluginStarted(): void {
    if (!this._enabled || !this._client) return;

    try {
      this._client.trackEvent({
        name: TelemetryEventType.Started,
        properties: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      // Silently ignore telemetry errors
    }
  }

  /**
   * Tracks a plugin execution completion event.
   *
   * @param durationMs - Execution duration in milliseconds.
   * @param outcome - The outcome of the plugin execution.
   * @param warningCount - Number of warnings generated (default: 0).
   */
  public trackPluginCompleted(
    durationMs: number,
    outcome: PluginOutcome,
    warningCount: number = 0
  ): void {
    if (!this._enabled || !this._client) return;

    try {
      this._client.trackEvent({
        name: TelemetryEventType.Completed,
        properties: {
          timestamp: new Date().toISOString(),
          outcome,
          warningCount: String(warningCount),
        },
        measurements: {
          durationMs,
        },
      });

      // Also track duration as a metric for easier aggregation
      this._client.trackMetric({
        name: 'plugin.duration',
        value: durationMs,
        properties: {
          outcome,
        },
      });
    } catch {
      // Silently ignore telemetry errors
    }
  }

  /**
   * Tracks a plugin error event.
   *
   * @param error - The error that occurred.
   * @param durationMs - Execution duration when the error occurred.
   */
  public trackPluginError(error: unknown, durationMs: number): void {
    if (!this._enabled || !this._client) return;

    try {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this._client.trackEvent({
        name: TelemetryEventType.Error,
        properties: {
          timestamp: new Date().toISOString(),
          errorType: getErrorType(error),
          errorMessage: sanitizeErrorMessage(errorMessage),
          durationMs: String(durationMs),
        },
      });
    } catch {
      // Silently ignore telemetry errors
    }
  }

  /**
   * Tracks a plugin warning event.
   *
   * @param category - Category of the warning (e.g., "configuration", "deprecation").
   * @param message - The warning message.
   */
  public trackPluginWarning(category: string, message: string): void {
    if (!this._enabled || !this._client) return;

    try {
      this._client.trackEvent({
        name: TelemetryEventType.Warning,
        properties: {
          timestamp: new Date().toISOString(),
          category: truncateString(category, 64),
          message: sanitizeErrorMessage(message),
        },
      });
    } catch {
      // Silently ignore telemetry errors
    }
  }

  /**
   * Flushes any pending telemetry events.
   *
   * @remarks
   * Call this before the plugin exits to ensure all events are sent.
   * This method has a built-in timeout to prevent blocking.
   *
   * @returns A promise that resolves when flushing is complete or times out.
   */
  public async flush(): Promise<void> {
    if (!this._enabled || !this._client) return;

    try {
      await new Promise<void>((resolve) => {
        this._client!.flush({
          callback: () => resolve(),
        });

        // Timeout after 2 seconds to prevent blocking
        setTimeout(() => resolve(), 2000);
      });
    } catch {
      // Silently ignore flush errors
    }
  }
}

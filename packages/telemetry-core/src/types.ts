/**
 * Telemetry types and interfaces for @voitanos Heft plugins.
 *
 * @remarks
 * This module defines the type system for privacy-focused telemetry collection.
 * All types are designed to avoid capturing personally identifiable information.
 */

/**
 * Configuration options for the TelemetryClient.
 */
export interface TelemetryConfig {
  /**
   * Azure Application Insights connection string.
   * Format: "InstrumentationKey=xxx;IngestionEndpoint=https://xxx"
   */
  connectionString: string;

  /**
   * Name of the plugin (e.g., "@voitanos/heft-stylelint-plugin").
   */
  pluginName: string;

  /**
   * Version of the plugin (e.g., "1.0.0").
   */
  pluginVersion: string;
}

/**
 * Context information collected for each telemetry event.
 *
 * @remarks
 * This context is designed to be privacy-safe, containing only
 * non-identifying system information.
 */
export interface TelemetryContext {
  /**
   * Operating system type (e.g., "linux", "darwin", "win32").
   */
  osType: string;

  /**
   * Operating system release version.
   */
  osVersion: string;

  /**
   * Node.js version (e.g., "22.11.0").
   */
  nodeVersion: string;

  /**
   * Whether the plugin is running in a CI/CD environment.
   *
   * @remarks
   * This is a boolean flag only - we do not identify which CI platform.
   */
  isCI: boolean;

  /**
   * Unique session identifier for correlating events within a single execution.
   *
   * @remarks
   * This is randomly generated per execution and cannot be used to identify users.
   */
  sessionId: string;

  /**
   * Name of the plugin.
   */
  pluginName: string;

  /**
   * Version of the plugin.
   */
  pluginVersion: string;

  /**
   * Version of the telemetry-core package.
   */
  telemetryClientVersion: string;
}

/**
 * Types of telemetry events that can be tracked.
 */
export enum TelemetryEventType {
  /** Plugin package was installed via npm/pnpm/yarn. */
  Installed = 'plugin.installed',

  /** Plugin execution started. */
  Started = 'plugin.started',

  /** Plugin execution completed (success or with warnings). */
  Completed = 'plugin.completed',

  /** Plugin encountered an error. */
  Error = 'plugin.error',

  /** Plugin generated a warning. */
  Warning = 'plugin.warning',
}

/**
 * Possible outcomes when a plugin completes execution.
 */
export enum PluginOutcome {
  /** Plugin completed successfully with no issues. */
  Success = 'success',

  /** Plugin completed but generated warnings. */
  Warning = 'warning',

  /** Plugin failed with an error. */
  Error = 'error',
}

/**
 * Base interface for all telemetry events.
 */
export interface TelemetryEventBase {
  /** Type of the event. */
  eventType: TelemetryEventType;

  /** ISO 8601 timestamp when the event occurred. */
  timestamp: string;
}

/**
 * Event tracked when a plugin is installed.
 */
export interface PluginInstalledEvent extends TelemetryEventBase {
  eventType: TelemetryEventType.Installed;
}

/**
 * Event tracked when a plugin starts execution.
 */
export interface PluginStartedEvent extends TelemetryEventBase {
  eventType: TelemetryEventType.Started;
}

/**
 * Event tracked when a plugin completes execution.
 */
export interface PluginCompletedEvent extends TelemetryEventBase {
  eventType: TelemetryEventType.Completed;

  /** Execution duration in milliseconds. */
  durationMs: number;

  /** Outcome of the plugin execution. */
  outcome: PluginOutcome;

  /** Number of warnings generated during execution. */
  warningCount: number;
}

/**
 * Event tracked when a plugin encounters an error.
 */
export interface PluginErrorEvent extends TelemetryEventBase {
  eventType: TelemetryEventType.Error;

  /**
   * Type/category of the error.
   *
   * @remarks
   * This is derived from the error class name, not the message.
   */
  errorType: string;

  /**
   * Sanitized error message.
   *
   * @remarks
   * File paths, emails, IPs, and other PII are stripped from this message.
   */
  errorMessage: string;

  /** Execution duration in milliseconds when the error occurred. */
  durationMs: number;
}

/**
 * Event tracked when a plugin generates a warning.
 */
export interface PluginWarningEvent extends TelemetryEventBase {
  eventType: TelemetryEventType.Warning;

  /**
   * Category of the warning (e.g., "configuration", "deprecation").
   */
  category: string;

  /**
   * Sanitized warning message.
   *
   * @remarks
   * File paths, emails, IPs, and other PII are stripped from this message.
   */
  message: string;
}

/**
 * Union type of all possible telemetry events.
 */
export type TelemetryEvent =
  | PluginInstalledEvent
  | PluginStartedEvent
  | PluginCompletedEvent
  | PluginErrorEvent
  | PluginWarningEvent;

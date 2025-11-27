/**
 * @voitanos/heft-plugins-telemetry-core
 *
 * Privacy-focused telemetry client for @voitanos Heft plugins.
 *
 * @packageDocumentation
 */

// Main client
export { TelemetryClient } from './TelemetryClient.js';

// Types and enums
export type {
  TelemetryConfig,
  TelemetryContext,
  TelemetryEvent,
  TelemetryEventBase,
  PluginInstalledEvent,
  PluginStartedEvent,
  PluginCompletedEvent,
  PluginErrorEvent,
  PluginWarningEvent,
} from './types.js';

export {
  TelemetryEventType,
  PluginOutcome,
} from './types.js';

// Utility functions (exported for advanced use cases)
export {
  isTelemetryDisabled,
  sanitizeErrorMessage,
  getErrorType,
  generateSessionId,
} from './utils.js';

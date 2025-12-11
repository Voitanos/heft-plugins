import {
  isTelemetryDisabled,
  sanitizeErrorMessage,
  getErrorType,
  truncateString,
  generateSessionId,
  getOsType,
  getNodeVersion,
  getIsCIEnvironment,
} from './utils.js';

describe('utils', () => {
  describe('isTelemetryDisabled', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return false when no opt-out env vars are set', () => {
      delete process.env.HEFT_TELEMETRY_DISABLED;
      delete process.env.DISABLE_TELEMETRY;
      delete process.env.DO_NOT_TRACK;
      delete process.env.TELEMETRY_DISABLED;

      expect(isTelemetryDisabled()).toBe(false);
    });

    it('should return true when HEFT_TELEMETRY_DISABLED=1', () => {
      process.env.HEFT_TELEMETRY_DISABLED = '1';
      expect(isTelemetryDisabled()).toBe(true);
    });

    it('should return true when DO_NOT_TRACK=true', () => {
      process.env.DO_NOT_TRACK = 'true';
      expect(isTelemetryDisabled()).toBe(true);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should replace file paths with [PATH]', () => {
      const message = 'Error at /home/user/project/src/file.ts';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('/home/user');
      expect(sanitized).toContain('[PATH]');
    });

    it('should replace email addresses with [EMAIL]', () => {
      const message = 'Contact user@example.com for help';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('user@example.com');
      expect(sanitized).toContain('[EMAIL]');
    });

    it('should replace IP addresses with [IP]', () => {
      const message = 'Failed to connect to 192.168.1.1';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('192.168.1.1');
      expect(sanitized).toContain('[IP]');
    });

    it('should replace URLs with [URL]', () => {
      const message = 'Failed to fetch https://api.example.com/data';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('https://');
      expect(sanitized).toContain('[URL]');
    });

    it('should truncate long messages', () => {
      const longMessage = 'a'.repeat(1000);
      const sanitized = sanitizeErrorMessage(longMessage);
      expect(sanitized.length).toBeLessThanOrEqual(512);
    });
  });

  describe('truncateString', () => {
    it('should not truncate short strings', () => {
      expect(truncateString('hello', 10)).toBe('hello');
    });

    it('should truncate long strings with ellipsis', () => {
      expect(truncateString('hello world', 8)).toBe('hello...');
    });
  });

  describe('getErrorType', () => {
    it('should return error constructor name for Error instances', () => {
      expect(getErrorType(new Error('test'))).toBe('Error');
      expect(getErrorType(new TypeError('test'))).toBe('TypeError');
    });

    it('should return UnknownError for non-Error values', () => {
      expect(getErrorType('string error')).toBe('UnknownError');
      expect(getErrorType(null)).toBe('UnknownError');
    });
  });

  describe('generateSessionId', () => {
    it('should return a 32-character hex string', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('getOsType', () => {
    it('should return a non-empty string', () => {
      const osType = getOsType();
      expect(typeof osType).toBe('string');
      expect(osType.length).toBeGreaterThan(0);
    });
  });

  describe('getNodeVersion', () => {
    it('should return version without v prefix', () => {
      const version = getNodeVersion();
      expect(version.startsWith('v')).toBe(false);
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('getIsCIEnvironment', () => {
    it('should return a boolean', () => {
      const isCI = getIsCIEnvironment();
      expect(typeof isCI).toBe('boolean');
    });
  });
});

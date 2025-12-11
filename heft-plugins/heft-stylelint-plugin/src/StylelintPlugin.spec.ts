import type { IHeftTaskSession, HeftConfiguration } from '@rushstack/heft';
import StylelintPlugin, { PLUGIN_NAME, IStylelintPluginOptions } from './StylelintPlugin.js';

describe('StylelintPlugin', () => {
  let plugin: StylelintPlugin;
  let mockTaskSession: jest.Mocked<IHeftTaskSession>;
  let mockHeftConfiguration: jest.Mocked<HeftConfiguration>;

  beforeEach(() => {
    plugin = new StylelintPlugin();

    // Create mock objects
    mockTaskSession = {
      hooks: {
        run: {
          tap: jest.fn(),
          tapPromise: jest.fn()
        }
      },
      logger: {
        terminal: {
          writeLine: jest.fn(),
          writeWarningLine: jest.fn(),
          writeErrorLine: jest.fn()
        }
      }
    } as any;

    mockHeftConfiguration = {
      buildFolderPath: '/fake/project/path'
    } as any;
  });

  describe('Plugin initialization', () => {
    it('should have the correct plugin name', () => {
      expect(PLUGIN_NAME).toBe('stylelint-plugin');
    });

    it('should be instantiable', () => {
      expect(plugin).toBeInstanceOf(StylelintPlugin);
    });
  });

  describe('apply method', () => {
    it('should register a run hook', () => {
      const options: IStylelintPluginOptions = {};

      plugin.apply(mockTaskSession, mockHeftConfiguration, options);

      expect(mockTaskSession.hooks.run.tapPromise).toHaveBeenCalledWith(
        expect.objectContaining({
          name: PLUGIN_NAME,
          stage: Number.MIN_SAFE_INTEGER
        }),
        expect.any(Function)
      );
    });

    it('should register hook with correct stage priority', () => {
      const options: IStylelintPluginOptions = {};

      plugin.apply(mockTaskSession, mockHeftConfiguration, options);

      const tapCall = (mockTaskSession.hooks.run.tapPromise as jest.Mock).mock.calls[0];
      expect(tapCall[0].stage).toBe(Number.MIN_SAFE_INTEGER);
    });
  });

  describe('Plugin metadata', () => {
    it('should implement IHeftTaskPlugin interface', () => {
      expect(typeof plugin.apply).toBe('function');
    });
  });
});

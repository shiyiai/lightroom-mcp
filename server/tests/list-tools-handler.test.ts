import { describe, it, expect } from '@jest/globals';
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_DEFINITIONS, listToolsHandler } from '../src/list-tools-handler.js';
import {
  DEVELOP_CONTROLLER_METHODS,
  DEVELOP_SETTING_KEYS,
  QUICK_DEVELOP_OPERATIONS,
  RAW_DEVELOP_SETTING_KEYS,
  TOOL_CONTRACTS,
} from '../src/tool-contracts.js';

const EXPECTED_TOOL_NAMES = [
  'search_photos',
  'get_selected_photos',
  'get_photo_metadata',
  'list_collections',
  'create_collection',
  'add_to_collection',
  'set_keywords',
  'set_rating',
  'import_photos',
  'export_photos',
  'list_develop_presets',
  'list_develop_setting_keys',
  'get_develop_settings_raw',
  'set_develop_settings_raw',
  'adjust_develop_settings',
  'apply_develop_preset',
  'create_develop_snapshot',
  'copy_develop_settings',
  'apply_develop_settings_to_selected',
  'set_develop_settings',
  'quick_develop',
  'undo_last_mcp_develop_edit',
  'lightroom_undo_status',
  'lightroom_undo',
  'lightroom_redo',
  'develop_controller_call',
] as const;

describe('TOOL_DEFINITIONS', () => {
  it('contains exactly 26 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(26);
  });

  it('tool names are unique', () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(EXPECTED_TOOL_NAMES)('"%s" is present', (name) => {
    expect(TOOL_DEFINITIONS.some((t) => t.name === name)).toBe(true);
  });

  it('every tool has name, description, and inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('is generated from tool contracts', () => {
    expect(TOOL_DEFINITIONS).toEqual(
      TOOL_CONTRACTS.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    );
  });

  it('rejects unknown top-level arguments for every tool', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.inputSchema.additionalProperties).toBe(false);
    }
  });
});

describe('listToolsHandler', () => {
  it('returns { tools: TOOL_DEFINITIONS }', () => {
    const result = listToolsHandler();
    expect(result.tools).toEqual(TOOL_DEFINITIONS);
  });
});

describe('tool required fields', () => {
  function toolRequired(name: string): string[] | undefined {
    return TOOL_DEFINITIONS.find((t) => t.name === name)?.inputSchema.required as string[] | undefined;
  }

  it.each<[string, string[]]>([
    ['get_photo_metadata', ['photo_id']],
    ['create_collection', ['name']],
    ['add_to_collection', ['collection_name', 'photo_ids']],
    ['set_keywords', ['photo_ids']],
    ['set_rating', ['photo_ids', 'rating']],
    ['import_photos', ['source_path']],
    ['export_photos', ['photo_ids', 'destination']],
    ['get_develop_settings_raw', ['photo_id']],
    ['set_develop_settings_raw', ['photo_ids', 'settings']],
    ['adjust_develop_settings', ['photo_ids', 'adjustments']],
    ['apply_develop_preset', ['photo_ids', 'preset_name']],
    ['create_develop_snapshot', ['photo_ids', 'name']],
    ['copy_develop_settings', ['source_id', 'target_ids']],
    ['set_develop_settings', ['photo_id', 'settings']],
    ['quick_develop', ['photo_ids', 'operation']],
    ['develop_controller_call', ['method']],
  ])('%s requires %j', (name, required) => {
    expect(toolRequired(name)).toEqual(required);
  });

  it.each([
    'search_photos',
    'get_selected_photos',
    'list_collections',
    'list_develop_presets',
    'list_develop_setting_keys',
    'apply_develop_settings_to_selected',
    'undo_last_mcp_develop_edit',
    'lightroom_undo_status',
    'lightroom_undo',
    'lightroom_redo',
  ])(
    '%s has no required fields',
    (name) => {
      expect(toolRequired(name)).toBeUndefined();
    },
  );
});

describe('set_keywords schema', () => {
  it('caps add/remove keyword arrays', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'set_keywords');
    const properties = tool?.inputSchema.properties as Record<string, { maxItems?: number }>;

    expect(properties.add_keywords.maxItems).toBe(1000);
    expect(properties.remove_keywords.maxItems).toBe(1000);
  });
});

describe('photo array schema', () => {
  it.each([
    ['add_to_collection', 'photo_ids'],
    ['set_keywords', 'photo_ids'],
    ['set_rating', 'photo_ids'],
    ['export_photos', 'photo_ids'],
    ['set_develop_settings_raw', 'photo_ids'],
    ['adjust_develop_settings', 'photo_ids'],
    ['apply_develop_preset', 'photo_ids'],
    ['create_develop_snapshot', 'photo_ids'],
    ['copy_develop_settings', 'target_ids'],
    ['quick_develop', 'photo_ids'],
  ])('%s.%s requires 1-1000 ids', (toolName, propertyName) => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === toolName);
    const properties = tool?.inputSchema.properties as Record<
      string,
      { minItems?: number; maxItems?: number }
    >;

    expect(properties[propertyName].minItems).toBe(1);
    expect(properties[propertyName].maxItems).toBe(1000);
  });
});

describe('develop setting schema', () => {
  function parseLuaDevelopSettingKeys(): string[] {
    const pluginPath = path.resolve(process.cwd(), '..', 'plugin', 'LightroomMCP.lrplugin', 'HandlerDevelop.lua');
    const source = fs.readFileSync(pluginPath, 'utf8');
    const match = source.match(/local ALLOWED_DEVELOP_SETTING_KEYS = \{([\s\S]*?)\n\}/);
    if (!match) {
      throw new Error('ALLOWED_DEVELOP_SETTING_KEYS table not found');
    }

    return [...match[1].matchAll(/^\s*"([^"]+)",/gm)].map((entry) => entry[1]);
  }

  it('restricts copy whitelist to allowlisted SDK keys', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'copy_develop_settings');
    const properties = tool?.inputSchema.properties as Record<
      string,
      { items?: { enum?: readonly string[] }; minItems?: number }
    >;

    expect(properties.settings.minItems).toBe(1);
    expect(properties.settings.items?.enum).toEqual(DEVELOP_SETTING_KEYS);
  });

  it('restricts direct settings object to allowlisted SDK keys', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'set_develop_settings');
    const properties = tool?.inputSchema.properties as Record<
      string,
      { additionalProperties?: boolean; minProperties?: number; properties?: Record<string, unknown> }
    >;

    expect(properties.settings.additionalProperties).toBe(false);
    expect(properties.settings.minProperties).toBe(1);
    expect(Object.keys(properties.settings.properties ?? {})).toEqual(DEVELOP_SETTING_KEYS);
  });

  it('allows raw settings to use arbitrary SDK keys', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'set_develop_settings_raw');
    const properties = tool?.inputSchema.properties as Record<
      string,
      { additionalProperties?: boolean; minProperties?: number }
    >;

    expect(properties.settings.additionalProperties).toBe(true);
    expect(properties.settings.minProperties).toBe(1);
    expect(RAW_DEVELOP_SETTING_KEYS).toContain('ToneCurvePV2012');
    expect(RAW_DEVELOP_SETTING_KEYS).toContain('HueAdjustmentYellow');
  });

  it('describes numeric relative adjustments', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'adjust_develop_settings');
    const properties = tool?.inputSchema.properties as Record<
      string,
      { additionalProperties?: unknown; minProperties?: number }
    >;

    expect(properties.adjustments.minProperties).toBe(1);
    expect(properties.adjustments.additionalProperties).toEqual({ type: 'number' });
  });

  it('enumerates quick develop operations', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'quick_develop');
    const properties = tool?.inputSchema.properties as Record<string, { enum?: readonly string[] }>;

    expect(properties.operation.enum).toEqual(QUICK_DEVELOP_OPERATIONS);
  });

  it('enumerates develop controller methods', () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === 'develop_controller_call');
    const properties = tool?.inputSchema.properties as Record<string, { enum?: readonly string[] }>;

    expect(properties.method.enum).toEqual(DEVELOP_CONTROLLER_METHODS);
  });

  it('matches Lua develop setting allowlist', () => {
    expect(parseLuaDevelopSettingKeys()).toEqual(DEVELOP_SETTING_KEYS);
  });
});

describe('tool contracts vs Lua dispatch', () => {
  function parseLuaDispatch(): Record<string, string> {
    const pluginPath = path.resolve(process.cwd(), '..', 'plugin', 'LightroomMCP.lrplugin', 'PluginInfoProvider.lua');
    const source = fs.readFileSync(pluginPath, 'utf8');
    const match = source.match(/local DISPATCH = \{([\s\S]*?)\n\}/);
    if (!match) {
      throw new Error('DISPATCH table not found');
    }

    return Object.fromEntries(
      [...match[1].matchAll(/^\s*([a-z_]+)\s*=\s*([A-Za-z][A-Za-z0-9_]*\.[A-Za-z][A-Za-z0-9_]*)\s*,/gm)]
        .map((entry) => [entry[1], entry[2]]),
    );
  }

  it('matches manifest names and handler targets', () => {
    const dispatch = parseLuaDispatch();
    const manifest = Object.fromEntries(
      TOOL_CONTRACTS.map((contract) => [contract.name, contract.luaHandler]),
    );

    expect(dispatch).toEqual(manifest);
  });
});

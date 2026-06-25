import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type InputSchema = Tool["inputSchema"];

export interface ToolContract {
  name: string;
  description: string;
  luaHandler: string;
  inputSchema: InputSchema;
}

const MAX_BULK_PHOTO_IDS = 1000;
const MAX_KEYWORDS = 1000;
const MAX_RAW_SETTING_KEYS = 1000;

export const DEVELOP_SETTING_KEYS = [
  "WhiteBalance",
  "Temperature",
  "Tint",
  "Exposure2012",
  "Contrast2012",
  "Highlights2012",
  "Shadows2012",
  "Whites2012",
  "Blacks2012",
  "Texture",
  "Clarity2012",
  "Dehaze",
  "Vibrance",
  "Saturation",
  "ParametricShadows",
  "ParametricDarks",
  "ParametricLights",
  "ParametricHighlights",
  "ParametricShadowSplit",
  "ParametricMidtoneSplit",
  "ParametricHighlightSplit",
  "ToneCurveName2012",
  "ConvertToGrayscale",
  "Sharpness",
  "SharpenRadius",
  "SharpenDetail",
  "SharpenEdgeMasking",
  "LuminanceSmoothing",
  "LuminanceNoiseReductionDetail",
  "LuminanceNoiseReductionContrast",
  "ColorNoiseReduction",
  "ColorNoiseReductionDetail",
  "ColorNoiseReductionSmoothness",
  "LensProfileEnable",
  "LensManualDistortionAmount",
  "PerspectiveVertical",
  "PerspectiveHorizontal",
  "PerspectiveRotate",
  "PerspectiveScale",
  "PerspectiveAspect",
  "PerspectiveUpright",
  "PostCropVignetteAmount",
  "PostCropVignetteMidpoint",
  "PostCropVignetteRoundness",
  "PostCropVignetteFeather",
  "PostCropVignetteStyle",
  "GrainAmount",
  "GrainSize",
  "GrainFrequency",
  "CropTop",
  "CropLeft",
  "CropBottom",
  "CropRight",
  "CropAngle",
] as const;

export const RAW_DEVELOP_SETTING_KEYS = [
  ...DEVELOP_SETTING_KEYS,
  "AutoBrightness",
  "AutoContrast",
  "AutoExposure",
  "AutoShadows",
  "BlueHue",
  "BlueSaturation",
  "Brightness",
  "CameraProfile",
  "ChromaticAberrationB",
  "ChromaticAberrationR",
  "Clarity",
  "ColorNoiseReduction",
  "ColorNoiseReductionDetail",
  "Contrast",
  "Defringe",
  "DefringeGreenAmount",
  "DefringeGreenHueHi",
  "DefringeGreenHueLo",
  "DefringePurpleAmount",
  "DefringePurpleHueHi",
  "DefringePurpleHueLo",
  "EnableCalibration",
  "EnableColorAdjustments",
  "EnableDetail",
  "EnableEffects",
  "EnableGradientBasedCorrections",
  "EnableGrayscaleMix",
  "EnableLensCorrections",
  "EnablePaintBasedCorrections",
  "EnableRedEye",
  "EnableRetouch",
  "EnableSplitToning",
  "EnableTransform",
  "Exposure",
  "FillLight",
  "GrayMixerAqua",
  "GrayMixerBlue",
  "GrayMixerGreen",
  "GrayMixerMagenta",
  "GrayMixerOrange",
  "GrayMixerPurple",
  "GrayMixerRed",
  "GrayMixerYellow",
  "GreenHue",
  "GreenSaturation",
  "HighlightRecovery",
  "HueAdjustmentAqua",
  "HueAdjustmentBlue",
  "HueAdjustmentGreen",
  "HueAdjustmentMagenta",
  "HueAdjustmentOrange",
  "HueAdjustmentPurple",
  "HueAdjustmentRed",
  "HueAdjustmentYellow",
  "LensProfileChromaticAberrationScale",
  "LensProfileDistortionScale",
  "LensProfileVignettingScale",
  "LuminanceAdjustmentAqua",
  "LuminanceAdjustmentBlue",
  "LuminanceAdjustmentGreen",
  "LuminanceAdjustmentMagenta",
  "LuminanceAdjustmentOrange",
  "LuminanceAdjustmentPurple",
  "LuminanceAdjustmentRed",
  "LuminanceAdjustmentYellow",
  "Orientation",
  "PerspectiveX",
  "PerspectiveY",
  "PostCropVignetteHighlightContrast",
  "ProcessVersion",
  "RedEyeInfo",
  "RedHue",
  "RedSaturation",
  "RetouchInfo",
  "SaturationAdjustmentAqua",
  "SaturationAdjustmentBlue",
  "SaturationAdjustmentGreen",
  "SaturationAdjustmentMagenta",
  "SaturationAdjustmentOrange",
  "SaturationAdjustmentPurple",
  "SaturationAdjustmentRed",
  "SaturationAdjustmentYellow",
  "ShadowTint",
  "SplitToningBalance",
  "SplitToningHighlightHue",
  "SplitToningHighlightSaturation",
  "SplitToningShadowHue",
  "SplitToningShadowSaturation",
  "ToneCurve",
  "ToneCurveName",
  "ToneCurvePV2012",
  "ToneCurvePV2012Blue",
  "ToneCurvePV2012Green",
  "ToneCurvePV2012Red",
  "TrimEnd",
  "TrimStart",
  "VignetteAmount",
  "VignetteMidpoint",
] as const;

export const DEVELOP_CONTROLLER_METHODS = [
  "get_value",
  "set_value",
  "get_range",
  "increment",
  "decrement",
  "reset_to_default",
  "reset_all",
  "reset_brushing",
  "reset_circular_gradient",
  "reset_crop",
  "reset_gradient",
  "reset_redeye",
  "reset_spot_removal",
  "reset_transforms",
  "set_auto_tone",
  "set_auto_white_balance",
  "get_process_version",
  "set_process_version",
  "get_selected_tool",
  "reveal_panel",
  "select_tool",
  "show_clipping",
  "toggle_overlay",
  "start_tracking",
  "stop_tracking",
  "set_tracking_delay",
  "set_multiple_adjustment_threshold",
  "reveal_adjusted_controls",
] as const;

export const QUICK_DEVELOP_OPERATIONS = [
  "adjust_image",
  "adjust_white_balance",
  "crop_aspect",
  "set_treatment",
  "set_white_balance",
] as const;

const stringArray = (description: string, maxItems?: number) => ({
  type: "array",
  items: { type: "string" },
  minItems: 1,
  ...(maxItems ? { maxItems } : {}),
  description,
});

const photoIdArray = (description: string) =>
  stringArray(description, MAX_BULK_PHOTO_IDS);

const developSettingValueSchema = {
  oneOf: [{ type: "number" }, { type: "string" }, { type: "boolean" }],
};

const rawDevelopSettingsSchema = {
  type: "object",
  additionalProperties: true,
  minProperties: 1,
  description:
    "Raw Lightroom SDK develop setting key/value pairs. Values are passed through to LrPhoto:applyDevelopSettings.",
};

const numericMapSchema = (description: string) => ({
  type: "object",
  additionalProperties: { type: "number" },
  minProperties: 1,
  description,
});

const developSettingsProperties = Object.fromEntries(
  DEVELOP_SETTING_KEYS.map((key) => [key, developSettingValueSchema]),
);

export const TOOL_CONTRACTS: ToolContract[] = [
  {
    name: "search_photos",
    luaHandler: "HandlerSearch.searchPhotos",
    description:
      "Search for photos in Lightroom catalog by criteria (paginated, default limit 100). Providing at least one filter (filename, keywords, rating, or date) significantly improves performance on large catalogs.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        filename: { type: "string", description: "Search by filename (partial match)" },
        keywords: stringArray("Search by keywords"),
        rating: {
          type: "number",
          description: "Filter by star rating (0-5)",
          minimum: 0,
          maximum: 5,
        },
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
        limit: { type: "number", description: "Max photos to return (default 100)", minimum: 0 },
        offset: { type: "number", description: "Number of photos to skip (default 0)", minimum: 0 },
      },
    },
  },
  {
    name: "get_selected_photos",
    luaHandler: "HandlerSelection.getSelectedPhotos",
    description: "Get currently selected photos in Lightroom (or filmstrip if no selection). Paginated, default limit 100.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "number", description: "Max photos to return (default 100)", minimum: 0 },
        offset: { type: "number", description: "Number of photos to skip (default 0)", minimum: 0 },
      },
    },
  },
  {
    name: "get_photo_metadata",
    luaHandler: "HandlerMetadata.getPhotoMetadata",
    description: "Get detailed metadata for a specific photo",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_id: { type: "string", description: "Photo ID or file path" },
      },
      required: ["photo_id"],
    },
  },
  {
    name: "list_collections",
    luaHandler: "HandlerCollections.listCollections",
    description: "List all collections in Lightroom catalog (paginated, default limit 100)",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "number", description: "Max collections to return (default 100)", minimum: 0 },
        offset: { type: "number", description: "Number of collections to skip (default 0)", minimum: 0 },
      },
    },
  },
  {
    name: "create_collection",
    luaHandler: "HandlerCollections.createCollection",
    description: "Create a new collection",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string", description: "Collection name" },
        parent: { type: "string", description: "Parent collection set (optional)" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_to_collection",
    luaHandler: "HandlerCollections.addToCollection",
    description: "Add photos to a collection",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        collection_name: { type: "string", description: "Collection name" },
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
      },
      required: ["collection_name", "photo_ids"],
    },
  },
  {
    name: "set_keywords",
    luaHandler: "HandlerOrganization.setKeywords",
    description: "Add or remove keywords from photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        add_keywords: stringArray("Keywords to add", MAX_KEYWORDS),
        remove_keywords: stringArray("Keywords to remove", MAX_KEYWORDS),
      },
      required: ["photo_ids"],
    },
  },
  {
    name: "set_rating",
    luaHandler: "HandlerOrganization.setRating",
    description: "Set star rating for photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        rating: {
          type: "number",
          description: "Star rating (0-5)",
          minimum: 0,
          maximum: 5,
        },
      },
      required: ["photo_ids", "rating"],
    },
  },
  {
    name: "import_photos",
    luaHandler: "HandlerImport.importPhotos",
    description: "Import photos into Lightroom catalog",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        source_path: { type: "string", description: "Path to photo or folder to import" },
        collection_name: {
          type: "string",
          description: "Collection to add imported photos to (optional)",
        },
        copy_to: {
          type: "string",
          description: "Destination folder for copying files (optional)",
        },
      },
      required: ["source_path"],
    },
  },
  {
    name: "export_photos",
    luaHandler: "HandlerExport.exportPhotos",
    description: "Export photos from Lightroom",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths to export"),
        destination: { type: "string", description: "Export destination folder" },
        format: {
          type: "string",
          description: "Export format (jpeg, png, tiff, original)",
          enum: ["jpeg", "png", "tiff", "original"],
        },
        quality: {
          type: "number",
          description: "JPEG quality (0-100)",
          minimum: 0,
          maximum: 100,
        },
        width: { type: "number", description: "Max width in pixels (optional)" },
        height: { type: "number", description: "Max height in pixels (optional)" },
      },
      required: ["photo_ids", "destination"],
    },
  },
  {
    name: "list_develop_presets",
    luaHandler: "HandlerDevelop.listDevelopPresets",
    description: "List available Develop presets across all preset folders",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "list_develop_setting_keys",
    luaHandler: "HandlerDevelop.listDevelopSettingKeys",
    description:
      "List known Lightroom Develop setting keys and raw Develop Controller methods exposed by this bridge. The raw tools do not restrict writes to this list.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "get_develop_settings_raw",
    luaHandler: "HandlerDevelop.getDevelopSettingsRaw",
    description: "Read the full raw Lightroom SDK Develop settings table for a photo",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_id: { type: "string", description: "Photo ID or file path" },
      },
      required: ["photo_id"],
    },
  },
  {
    name: "set_develop_settings_raw",
    luaHandler: "HandlerDevelop.setDevelopSettingsRaw",
    description:
      "Write raw Lightroom SDK Develop setting key/value pairs to one or more photos without the stable-key allowlist",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        settings: rawDevelopSettingsSchema,
      },
      required: ["photo_ids", "settings"],
    },
  },
  {
    name: "adjust_develop_settings",
    luaHandler: "HandlerDevelop.adjustDevelopSettings",
    description:
      "Apply relative numeric deltas to raw Lightroom Develop settings on one or more photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        adjustments: numericMapSchema("Setting deltas, e.g. {\"Exposure2012\": 0.2}"),
        clamp: {
          type: "object",
          additionalProperties: {
            type: "object",
            additionalProperties: false,
            properties: {
              min: { type: "number" },
              max: { type: "number" },
            },
          },
          description: "Optional per-key min/max clamps applied after the delta",
        },
      },
      required: ["photo_ids", "adjustments"],
    },
  },
  {
    name: "apply_develop_preset",
    luaHandler: "HandlerDevelop.applyDevelopPreset",
    description: "Apply a named Develop preset to one or more photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        preset_name: {
          type: "string",
          description: "Preset name (first match across folders)",
        },
      },
      required: ["photo_ids", "preset_name"],
    },
  },
  {
    name: "create_develop_snapshot",
    luaHandler: "HandlerDevelop.createDevelopSnapshot",
    description: "Create a Lightroom Develop snapshot for one or more photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        name: { type: "string", description: "Snapshot name" },
        update_existing: {
          type: "boolean",
          description: "Update an existing snapshot with the same name instead of no-oping",
        },
      },
      required: ["photo_ids", "name"],
    },
  },
  {
    name: "copy_develop_settings",
    luaHandler: "HandlerDevelop.copyDevelopSettings",
    description: "Copy Develop settings from one photo to others",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        source_id: {
          type: "string",
          description: "Source photo ID or file path",
        },
        target_ids: photoIdArray("Target photo IDs or file paths"),
        settings: {
          type: "array",
          items: {
            type: "string",
            enum: DEVELOP_SETTING_KEYS,
          },
          minItems: 1,
          maxItems: DEVELOP_SETTING_KEYS.length,
          description:
            "Optional whitelist of SDK setting keys (e.g., Exposure2012, Contrast2012). Omit to copy all.",
        },
      },
      required: ["source_id", "target_ids"],
    },
  },
  {
    name: "apply_develop_settings_to_selected",
    luaHandler: "HandlerDevelop.applyDevelopSettingsToSelected",
    description:
      "Copy Develop settings from an explicit source photo, or the first selected photo, to the other currently selected Lightroom photos",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        source_id: {
          type: "string",
          description: "Optional source photo ID or file path. Defaults to the first selected photo.",
        },
        settings: stringArray("Optional raw SDK setting keys to copy", MAX_RAW_SETTING_KEYS),
        include_source: {
          type: "boolean",
          description: "Apply the copied settings to the source photo too. Defaults to false.",
        },
      },
    },
  },
  {
    name: "set_develop_settings",
    luaHandler: "HandlerDevelop.setDevelopSettings",
    description:
      "Set Develop settings directly on a photo. Keys use allowlisted Lightroom SDK names (Exposure2012, WhiteBalance, Contrast2012, Highlights2012, Shadows2012, Whites2012, Blacks2012, Clarity2012, Vibrance, Saturation, etc.)",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_id: {
          type: "string",
          description: "Photo ID or file path",
        },
        settings: {
          type: "object",
          properties: developSettingsProperties,
          additionalProperties: false,
          minProperties: 1,
          description: "Allowlisted SDK setting key/value pairs (e.g., {\"Exposure2012\": 0.5})",
        },
      },
      required: ["photo_id", "settings"],
    },
  },
  {
    name: "quick_develop",
    luaHandler: "HandlerDevelop.quickDevelop",
    description:
      "Call Lightroom's LrPhoto quickDevelop APIs on one or more photos, including image adjustment, white balance, crop aspect, treatment, and white balance preset",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        photo_ids: photoIdArray("Array of photo IDs or file paths"),
        operation: {
          type: "string",
          enum: QUICK_DEVELOP_OPERATIONS,
          description: "quickDevelop operation to call",
        },
        setting_name: {
          type: "string",
          description: "Develop parameter for adjust_image or adjust_white_balance",
        },
        size: {
          oneOf: [{ type: "string" }, { type: "number" }],
          description: "Step size for adjust_image: small, large, or a numeric step",
        },
        amount: { type: "number", description: "Amount for adjust_white_balance" },
        aspect_ratio: { type: "string", description: "Aspect ratio for crop_aspect" },
        value: { type: "string", description: "Treatment or white balance value" },
      },
      required: ["photo_ids", "operation"],
    },
  },
  {
    name: "undo_last_mcp_develop_edit",
    luaHandler: "HandlerDevelop.undoLastMcpDevelopEdit",
    description:
      "Restore the previous Develop settings captured before the last MCP-initiated Develop edit in this plugin session",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "lightroom_undo_status",
    luaHandler: "HandlerDevelop.lightroomUndoStatus",
    description: "Report Lightroom's global undo/redo availability via LrUndo",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "lightroom_undo",
    luaHandler: "HandlerDevelop.lightroomUndo",
    description: "Call Lightroom's global LrUndo.undo()",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "lightroom_redo",
    luaHandler: "HandlerDevelop.lightroomRedo",
    description: "Call Lightroom's global LrUndo.redo()",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "develop_controller_call",
    luaHandler: "HandlerDevelop.developControllerCall",
    description:
      "Call raw LrDevelopController methods for the current photo. Lightroom must be in the Develop module for most methods.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        method: {
          type: "string",
          enum: DEVELOP_CONTROLLER_METHODS,
          description: "LrDevelopController method alias",
        },
        param: {
          type: "string",
          description: "Develop parameter or panel/tool identifier required by some methods",
        },
        value: {
          oneOf: [{ type: "number" }, { type: "string" }, { type: "boolean" }],
          description: "Value for set_value, set_process_version, reveal_adjusted_controls, or select_tool",
        },
        seconds: {
          type: "number",
          description: "Seconds for set_tracking_delay or set_multiple_adjustment_threshold",
        },
      },
      required: ["method"],
    },
  },
];

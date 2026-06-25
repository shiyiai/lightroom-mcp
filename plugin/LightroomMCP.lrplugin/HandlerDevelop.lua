local LrApplication = import 'LrApplication'
local LrDevelopController = import 'LrDevelopController'
local LrUndo = import 'LrUndo'

local PhotoLookup = require 'PhotoLookup'
local Log = require 'Log'

local DevelopHandler = {}

local MAX_BULK_PHOTO_IDS = 1000
local MAX_RAW_SETTING_KEYS = 1000
local MAX_UNDO_ENTRIES = 20

local ALLOWED_DEVELOP_SETTING_KEYS = {
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
}

local KNOWN_RAW_DEVELOP_SETTING_KEYS = {
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
}

local DEVELOP_CONTROLLER_METHODS = {
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
}

local QUICK_DEVELOP_OPERATIONS = {
    adjust_image = true,
    adjust_white_balance = true,
    crop_aspect = true,
    set_treatment = true,
    set_white_balance = true,
}

local ALLOWED_DEVELOP_SETTING_LOOKUP = {}
for _, key in ipairs(ALLOWED_DEVELOP_SETTING_KEYS) do
    ALLOWED_DEVELOP_SETTING_LOOKUP[key] = true
end

local function undoStack()
    _G.LightroomMCP_DevelopUndoStack = _G.LightroomMCP_DevelopUndoStack or {}
    return _G.LightroomMCP_DevelopUndoStack
end

local function copyTable(value, seen)
    if type(value) ~= "table" then
        return value
    end

    seen = seen or {}
    if seen[value] then
        return seen[value]
    end

    local out = {}
    seen[value] = out
    for key, item in pairs(value) do
        out[copyTable(key, seen)] = copyTable(item, seen)
    end
    return out
end

local function countTableKeys(value)
    local count = 0
    for _ in pairs(value) do
        count = count + 1
    end
    return count
end

local function requireString(value, name)
    if type(value) ~= "string" or value == "" then
        error(name .. " is required")
    end
end

local function requireStringArray(value, name, maxItems)
    if type(value) ~= "table" then
        error(name .. " is required")
    end

    local count = 0
    for key, item in pairs(value) do
        if type(key) ~= "number" or key < 1 or key ~= math.floor(key) then
            error(name .. " must be an array")
        end
        if type(item) ~= "string" or item == "" then
            error(name .. "[" .. tostring(key) .. "] must be a non-empty string")
        end
        count = count + 1
    end

    if count == 0 then
        error(name .. " is required")
    end
    if count ~= #value then
        error(name .. " must be an array")
    end
    if maxItems and count > maxItems then
        error(name .. " must contain at most " .. tostring(maxItems) .. " items")
    end
end

local function requireOptionalStringArray(value, name, maxItems)
    if value == nil then
        return
    end
    requireStringArray(value, name, maxItems)
end

local function requireRawSettingValue(key, value)
    local valueType = type(value)
    if valueType == "number" or valueType == "string" or valueType == "boolean" or valueType == "nil" then
        return
    end
    if valueType == "table" then
        for childKey, childValue in pairs(value) do
            if type(childKey) ~= "string" and type(childKey) ~= "number" then
                error("Unsupported nested key for develop setting key: " .. tostring(key))
            end
            requireRawSettingValue(key, childValue)
        end
        return
    end
    error("Unsupported value for develop setting key: " .. tostring(key))
end

local function requireRawDevelopSettingsObject(settings)
    if type(settings) ~= "table" then
        error("settings is required")
    end

    local count = 0
    for key, value in pairs(settings) do
        if type(key) ~= "string" or key == "" then
            error("settings keys must be non-empty strings")
        end
        requireRawSettingValue(key, value)
        count = count + 1
    end

    if count == 0 then
        error("settings is required")
    end
    if count > MAX_RAW_SETTING_KEYS then
        error("settings must contain at most " .. tostring(MAX_RAW_SETTING_KEYS) .. " keys")
    end
end

local function requireNumericMap(value, name)
    if type(value) ~= "table" then
        error(name .. " is required")
    end

    local count = 0
    for key, item in pairs(value) do
        if type(key) ~= "string" or key == "" then
            error(name .. " keys must be non-empty strings")
        end
        if type(item) ~= "number" then
            error(name .. "." .. key .. " must be a number")
        end
        count = count + 1
    end

    if count == 0 then
        error(name .. " is required")
    end
end

local function requireClampMap(clamp)
    if clamp == nil then
        return
    end
    if type(clamp) ~= "table" then
        error("clamp must be an object")
    end
    for key, bounds in pairs(clamp) do
        if type(key) ~= "string" or key == "" then
            error("clamp keys must be non-empty strings")
        end
        if type(bounds) ~= "table" then
            error("clamp." .. key .. " must be an object")
        end
        if bounds.min ~= nil and type(bounds.min) ~= "number" then
            error("clamp." .. key .. ".min must be a number")
        end
        if bounds.max ~= nil and type(bounds.max) ~= "number" then
            error("clamp." .. key .. ".max must be a number")
        end
    end
end

local function requireAllowedDevelopSettingKey(key)
    if not ALLOWED_DEVELOP_SETTING_LOOKUP[key] then
        error("Unsupported develop setting key: " .. tostring(key))
    end
end

local function requireDevelopSettingValue(key, value)
    local valueType = type(value)
    if valueType ~= "number" and valueType ~= "string" and valueType ~= "boolean" then
        error("Unsupported value for develop setting key: " .. tostring(key))
    end
end

local function requireDevelopSettingsObject(settings)
    if type(settings) ~= "table" then
        error("settings is required")
    end

    local count = 0
    for key, value in pairs(settings) do
        if type(key) ~= "string" then
            error("settings keys must be strings")
        end
        requireAllowedDevelopSettingKey(key)
        requireDevelopSettingValue(key, value)
        count = count + 1
    end

    if count == 0 then
        error("settings is required")
    end
end

local function requireDevelopSettingWhitelist(settings)
    if settings == nil then
        return
    end

    requireStringArray(settings, "settings", #ALLOWED_DEVELOP_SETTING_KEYS)
    for _, key in ipairs(settings) do
        requireAllowedDevelopSettingKey(key)
    end
end

local function captureUndo(catalog, label, photos)
    local entries = {}
    catalog:withReadAccessDo(function()
        for _, photo in ipairs(photos) do
            if photo then
                table.insert(entries, {
                    id = tostring(photo.localIdentifier),
                    path = photo:getRawMetadata('path'),
                    settings = copyTable(photo:getDevelopSettings()),
                })
            end
        end
    end)

    if #entries == 0 then
        return
    end

    local stack = undoStack()
    table.insert(stack, {
        label = label,
        entries = entries,
    })
    while #stack > MAX_UNDO_ENTRIES do
        table.remove(stack, 1)
    end
end

local function resolvedPhotos(catalog, photoIds)
    local photos = {}
    local resolved = PhotoLookup.resolveMany(catalog, photoIds)
    for _, entry in ipairs(resolved) do
        if entry.photo then
            table.insert(photos, entry.photo)
        end
    end
    return photos, resolved
end

local function applySettingsToPhotos(catalog, label, photoIds, settings)
    local appliedCount = 0
    local photosToCapture, resolved = resolvedPhotos(catalog, photoIds)

    if #photosToCapture == 0 then
        return 0, resolved
    end

    captureUndo(catalog, label, photosToCapture)

    catalog:withWriteAccessDo(label, function()
        for _, photo in ipairs(photosToCapture) do
            photo:applyDevelopSettings(settings)
            appliedCount = appliedCount + 1
        end
    end)

    return appliedCount, resolved
end

local function tableContains(list, value)
    for _, item in ipairs(list) do
        if item == value then
            return true
        end
    end
    return false
end

local function findPresetByName(name)
    for _, folder in ipairs(LrApplication.developPresetFolders()) do
        for _, preset in ipairs(folder:getDevelopPresets()) do
            if preset:getName() == name then
                return preset, folder:getName()
            end
        end
    end
    return nil, nil
end

function DevelopHandler.listDevelopSettingKeys(_)
    return {
        success = true,
        stable_keys = copyTable(ALLOWED_DEVELOP_SETTING_KEYS),
        raw_known_keys = copyTable(KNOWN_RAW_DEVELOP_SETTING_KEYS),
        develop_controller_methods = copyTable(DEVELOP_CONTROLLER_METHODS),
        quick_develop_operations = { "adjust_image", "adjust_white_balance", "crop_aspect", "set_treatment", "set_white_balance" },
        notes = {
            "set_develop_settings validates stable keys; set_develop_settings_raw passes arbitrary SDK keys through after value-shape validation.",
            "develop_controller_call targets the current photo and usually requires Lightroom's Develop module to be active.",
        },
    }
end

function DevelopHandler.getDevelopSettingsRaw(args)
    requireString(args.photo_id, "photo_id")

    local catalog = LrApplication.activeCatalog()
    local photo = PhotoLookup.resolveOne(catalog, args.photo_id)
    local settings

    if not photo then
        error("Photo not found: " .. args.photo_id)
    end

    catalog:withReadAccessDo(function()
        settings = copyTable(photo:getDevelopSettings())
    end)

    return {
        success = true,
        photo_id = tostring(photo.localIdentifier),
        path = photo:getRawMetadata('path'),
        settings = settings,
        key_count = countTableKeys(settings),
    }
end

function DevelopHandler.listDevelopPresets(_)
    local out = {}
    for _, folder in ipairs(LrApplication.developPresetFolders()) do
        local fname = folder:getName()
        for _, preset in ipairs(folder:getDevelopPresets()) do
            table.insert(out, { name = preset:getName(), folder = fname })
        end
    end

    Log.info(string.format("Listed %d develop presets", #out))

    return {
        success = true,
        presets = out,
        count = #out,
    }
end

function DevelopHandler.setDevelopSettingsRaw(args)
    requireStringArray(args.photo_ids, "photo_ids", MAX_BULK_PHOTO_IDS)
    requireRawDevelopSettingsObject(args.settings)

    local catalog = LrApplication.activeCatalog()
    local appliedCount = applySettingsToPhotos(catalog, "Set Raw Develop Settings", args.photo_ids, args.settings)

    Log.info(string.format("Set raw develop settings on %d photos", appliedCount))

    return {
        success = true,
        applied = appliedCount,
        key_count = countTableKeys(args.settings),
    }
end

function DevelopHandler.adjustDevelopSettings(args)
    requireStringArray(args.photo_ids, "photo_ids", MAX_BULK_PHOTO_IDS)
    requireNumericMap(args.adjustments, "adjustments")
    requireClampMap(args.clamp)

    local catalog = LrApplication.activeCatalog()
    local appliedCount = 0
    local results = {}
    local photos = resolvedPhotos(catalog, args.photo_ids)
    local planned = {}

    catalog:withReadAccessDo(function()
        for _, photo in ipairs(photos) do
            local current = photo:getDevelopSettings()
            local settings = {}
            local changes = {}

            for key, delta in pairs(args.adjustments) do
                local currentValue = current[key]
                if currentValue == nil then
                    currentValue = 0
                end
                if type(currentValue) ~= "number" then
                    error("Cannot apply numeric delta to non-number setting: " .. key)
                end

                local nextValue = currentValue + delta
                local bounds = args.clamp and args.clamp[key]
                if bounds then
                    if bounds.min ~= nil and nextValue < bounds.min then
                        nextValue = bounds.min
                    end
                    if bounds.max ~= nil and nextValue > bounds.max then
                        nextValue = bounds.max
                    end
                end

                settings[key] = nextValue
                changes[key] = {
                    previous = currentValue,
                    next = nextValue,
                }
            end

            table.insert(results, {
                photo_id = tostring(photo.localIdentifier),
                path = photo:getRawMetadata('path'),
                changes = changes,
            })
            table.insert(planned, {
                photo = photo,
                settings = settings,
            })
        end
    end)

    if #planned > 0 then
        captureUndo(catalog, "Adjust Develop Settings", photos)
    end

    catalog:withWriteAccessDo("Adjust Develop Settings", function()
        for _, item in ipairs(planned) do
            item.photo:applyDevelopSettings(item.settings)
            appliedCount = appliedCount + 1
        end
    end)

    Log.info(string.format("Adjusted develop settings on %d photos", appliedCount))

    return {
        success = true,
        applied = appliedCount,
        photos = results,
    }
end

function DevelopHandler.applyDevelopPreset(args)
    requireStringArray(args.photo_ids, "photo_ids", MAX_BULK_PHOTO_IDS)
    requireString(args.preset_name, "preset_name")

    local preset, folder = findPresetByName(args.preset_name)
    if not preset then
        error("Preset not found: " .. args.preset_name)
    end

    local catalog = LrApplication.activeCatalog()
    local appliedCount = 0
    local photos = resolvedPhotos(catalog, args.photo_ids)

    if #photos > 0 then
        captureUndo(catalog, "Apply Develop Preset", photos)
    end

    catalog:withWriteAccessDo("Apply Develop Preset", function()
        for _, photo in ipairs(photos) do
            photo:applyDevelopPreset(preset)
            appliedCount = appliedCount + 1
        end
    end)

    Log.info(string.format("Applied preset %s to %d photos", args.preset_name, appliedCount))

    return {
        success = true,
        applied = appliedCount,
        preset = args.preset_name,
        folder = folder,
        message = string.format("Applied preset %s to %d photos", args.preset_name, appliedCount),
    }
end

function DevelopHandler.createDevelopSnapshot(args)
    requireStringArray(args.photo_ids, "photo_ids", MAX_BULK_PHOTO_IDS)
    requireString(args.name, "name")
    if args.update_existing ~= nil and type(args.update_existing) ~= "boolean" then
        error("update_existing must be a boolean")
    end

    local catalog = LrApplication.activeCatalog()
    local createdCount = 0
    local skippedCount = 0
    local photos = resolvedPhotos(catalog, args.photo_ids)

    catalog:withWriteAccessDo("Create Develop Snapshot", function()
        for _, photo in ipairs(photos) do
            local ok = photo:createDevelopSnapshot(args.name, args.update_existing == true)
            if ok then
                createdCount = createdCount + 1
            else
                skippedCount = skippedCount + 1
            end
        end
    end)

    return {
        success = true,
        created = createdCount,
        skipped = skippedCount,
        name = args.name,
    }
end

function DevelopHandler.copyDevelopSettings(args)
    requireString(args.source_id, "source_id")
    requireStringArray(args.target_ids, "target_ids", MAX_BULK_PHOTO_IDS)
    requireDevelopSettingWhitelist(args.settings)

    local catalog = LrApplication.activeCatalog()
    local sourceSettings
    local source = PhotoLookup.resolveOne(catalog, args.source_id)

    if not source then
        error("Source photo not found: " .. args.source_id)
    end

    catalog:withReadAccessDo(function()
        sourceSettings = source:getDevelopSettings()
    end)

    local toApply = sourceSettings
    if args.settings then
        toApply = {}
        for _, key in ipairs(args.settings) do
            toApply[key] = sourceSettings[key]
        end
    end

    local copiedCount = 0

    copiedCount = applySettingsToPhotos(catalog, "Copy Develop Settings", args.target_ids, toApply)

    Log.info(string.format("Copied develop settings from %s to %d photos", args.source_id, copiedCount))

    return {
        success = true,
        copied = copiedCount,
        source = args.source_id,
        message = string.format("Copied develop settings from %s to %d photos", args.source_id, copiedCount),
    }
end

function DevelopHandler.applyDevelopSettingsToSelected(args)
    args = args or {}
    requireOptionalStringArray(args.settings, "settings", MAX_RAW_SETTING_KEYS)
    if args.include_source ~= nil and type(args.include_source) ~= "boolean" then
        error("include_source must be a boolean")
    end

    local catalog = LrApplication.activeCatalog()
    local selected = catalog:getTargetPhotos() or {}
    if #selected == 0 then
        error("No selected photos")
    end

    local source = nil
    if args.source_id then
        source = PhotoLookup.resolveOne(catalog, args.source_id)
        if not source then
            error("Source photo not found: " .. args.source_id)
        end
    else
        source = selected[1]
    end

    local sourceSettings
    catalog:withReadAccessDo(function()
        sourceSettings = source:getDevelopSettings()
    end)

    local toApply = sourceSettings
    if args.settings then
        toApply = {}
        for _, key in ipairs(args.settings) do
            toApply[key] = sourceSettings[key]
        end
    end

    local targetIds = {}
    for _, photo in ipairs(selected) do
        local isSource = photo == source or tostring(photo.localIdentifier) == tostring(source.localIdentifier)
        if args.include_source == true or not isSource then
            table.insert(targetIds, tostring(photo.localIdentifier))
        end
    end

    local copiedCount = 0
    if #targetIds > 0 then
        copiedCount = applySettingsToPhotos(catalog, "Apply Develop Settings To Selected", targetIds, toApply)
    end

    return {
        success = true,
        copied = copiedCount,
        source = tostring(source.localIdentifier),
        target_ids = targetIds,
    }
end

function DevelopHandler.setDevelopSettings(args)
    requireString(args.photo_id, "photo_id")
    requireDevelopSettingsObject(args.settings)

    local catalog = LrApplication.activeCatalog()
    local applied = applySettingsToPhotos(catalog, "Set Develop Settings", { args.photo_id }, args.settings)
    if applied == 0 then
        error("Photo not found: " .. args.photo_id)
    end

    Log.info(string.format("Set develop settings on photo %s", args.photo_id))

    return {
        success = applied > 0,
        photo_id = args.photo_id,
    }
end

function DevelopHandler.quickDevelop(args)
    requireStringArray(args.photo_ids, "photo_ids", MAX_BULK_PHOTO_IDS)
    requireString(args.operation, "operation")
    if not QUICK_DEVELOP_OPERATIONS[args.operation] then
        error("Unsupported quickDevelop operation: " .. tostring(args.operation))
    end
    if args.operation == "adjust_image" then
        requireString(args.setting_name, "setting_name")
        if type(args.size) ~= "string" and type(args.size) ~= "number" then
            error("size is required")
        end
    elseif args.operation == "adjust_white_balance" then
        requireString(args.setting_name, "setting_name")
        if type(args.amount) ~= "number" then
            error("amount is required")
        end
    elseif args.operation == "crop_aspect" then
        requireString(args.aspect_ratio, "aspect_ratio")
    elseif args.operation == "set_treatment" then
        requireString(args.value, "value")
    elseif args.operation == "set_white_balance" then
        requireString(args.value, "value")
    end

    local catalog = LrApplication.activeCatalog()
    local appliedCount = 0
    local photos = resolvedPhotos(catalog, args.photo_ids)

    if #photos > 0 then
        captureUndo(catalog, "Quick Develop", photos)
    end

    catalog:withWriteAccessDo("Quick Develop", function()
        for _, photo in ipairs(photos) do
            if args.operation == "adjust_image" then
                photo:quickDevelopAdjustImage(args.setting_name, args.size)
            elseif args.operation == "adjust_white_balance" then
                photo:quickDevelopAdjustWhiteBalance(args.setting_name, args.amount)
            elseif args.operation == "crop_aspect" then
                photo:quickDevelopCropAspect(args.aspect_ratio)
            elseif args.operation == "set_treatment" then
                photo:quickDevelopSetTreatment(args.value)
            elseif args.operation == "set_white_balance" then
                photo:quickDevelopSetWhiteBalance(args.value)
            end
            appliedCount = appliedCount + 1
        end
    end)

    return {
        success = true,
        applied = appliedCount,
        operation = args.operation,
    }
end

function DevelopHandler.undoLastMcpDevelopEdit(_)
    local stack = undoStack()
    local entry = table.remove(stack)
    if not entry then
        error("No MCP develop edit to undo")
    end

    local catalog = LrApplication.activeCatalog()
    local restoredCount = 0
    local photosByIndex = {}
    for index, item in ipairs(entry.entries) do
        local photo = PhotoLookup.resolveOne(catalog, item.id)
        if not photo and item.path then
            photo = PhotoLookup.resolveOne(catalog, item.path)
        end
        photosByIndex[index] = photo
    end

    catalog:withWriteAccessDo("Undo Last MCP Develop Edit", function()
        for index, item in ipairs(entry.entries) do
            local photo = photosByIndex[index]
            if photo then
                photo:applyDevelopSettings(item.settings)
                restoredCount = restoredCount + 1
            end
        end
    end)

    return {
        success = true,
        restored = restoredCount,
        label = entry.label,
        remaining_undo_entries = #stack,
    }
end

function DevelopHandler.lightroomUndoStatus(_)
    return {
        success = true,
        can_undo = LrUndo.canUndo(),
        can_redo = LrUndo.canRedo(),
    }
end

function DevelopHandler.lightroomUndo(_)
    if not LrUndo.canUndo() then
        error("Lightroom undo is not available")
    end
    LrUndo.undo()
    return {
        success = true,
        action = "undo",
        can_undo = LrUndo.canUndo(),
        can_redo = LrUndo.canRedo(),
    }
end

function DevelopHandler.lightroomRedo(_)
    if not LrUndo.canRedo() then
        error("Lightroom redo is not available")
    end
    LrUndo.redo()
    return {
        success = true,
        action = "redo",
        can_undo = LrUndo.canUndo(),
        can_redo = LrUndo.canRedo(),
    }
end

function DevelopHandler.developControllerCall(args)
    requireString(args.method, "method")
    if not tableContains(DEVELOP_CONTROLLER_METHODS, args.method) then
        error("Unsupported develop controller method: " .. tostring(args.method))
    end

    if args.method == "get_value" then
        requireString(args.param, "param")
        return { success = true, method = args.method, value = LrDevelopController.getValue(args.param) }
    elseif args.method == "set_value" then
        requireString(args.param, "param")
        if type(args.value) ~= "number" then error("value is required") end
        LrDevelopController.setValue(args.param, args.value)
    elseif args.method == "get_range" then
        requireString(args.param, "param")
        local minValue, maxValue = LrDevelopController.getRange(args.param)
        return { success = true, method = args.method, param = args.param, min = minValue, max = maxValue }
    elseif args.method == "increment" then
        requireString(args.param, "param")
        LrDevelopController.increment(args.param)
    elseif args.method == "decrement" then
        requireString(args.param, "param")
        LrDevelopController.decrement(args.param)
    elseif args.method == "reset_to_default" then
        requireString(args.param, "param")
        LrDevelopController.resetToDefault(args.param)
    elseif args.method == "reset_all" then
        LrDevelopController.resetAllDevelopAdjustments()
    elseif args.method == "reset_brushing" then
        LrDevelopController.resetBrushing()
    elseif args.method == "reset_circular_gradient" then
        LrDevelopController.resetCircularGradient()
    elseif args.method == "reset_crop" then
        LrDevelopController.resetCrop()
    elseif args.method == "reset_gradient" then
        LrDevelopController.resetGradient()
    elseif args.method == "reset_redeye" then
        LrDevelopController.resetRedeye()
    elseif args.method == "reset_spot_removal" then
        LrDevelopController.resetSpotRemoval()
    elseif args.method == "reset_transforms" then
        LrDevelopController.resetTransforms()
    elseif args.method == "set_auto_tone" then
        LrDevelopController.setAutoTone()
    elseif args.method == "set_auto_white_balance" then
        LrDevelopController.setAutoWhiteBalance()
    elseif args.method == "get_process_version" then
        return { success = true, method = args.method, value = LrDevelopController.getProcessVersion() }
    elseif args.method == "set_process_version" then
        requireString(args.value, "value")
        LrDevelopController.setProcessVersion(args.value)
    elseif args.method == "get_selected_tool" then
        return { success = true, method = args.method, value = LrDevelopController.getSelectedTool() }
    elseif args.method == "reveal_panel" then
        requireString(args.param, "param")
        LrDevelopController.revealPanel(args.param)
    elseif args.method == "select_tool" then
        requireString(args.value, "value")
        LrDevelopController.selectTool(args.value)
    elseif args.method == "show_clipping" then
        LrDevelopController.showClipping()
    elseif args.method == "toggle_overlay" then
        LrDevelopController.toggleOverlay()
    elseif args.method == "start_tracking" then
        requireString(args.param, "param")
        LrDevelopController.startTracking(args.param)
    elseif args.method == "stop_tracking" then
        LrDevelopController.stopTracking()
    elseif args.method == "set_tracking_delay" then
        if type(args.seconds) ~= "number" then error("seconds is required") end
        LrDevelopController.setTrackingDelay(args.seconds)
    elseif args.method == "set_multiple_adjustment_threshold" then
        if type(args.seconds) ~= "number" then error("seconds is required") end
        LrDevelopController.setMultipleAdjustmentThreshold(args.seconds)
    elseif args.method == "reveal_adjusted_controls" then
        if type(args.value) ~= "boolean" then error("value is required") end
        LrDevelopController.revealAdjustedControls(args.value)
    end

    return {
        success = true,
        method = args.method,
        param = args.param,
    }
end

return DevelopHandler

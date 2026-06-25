local helper = require 'spec_helper'

local function fakePreset(name)
    return { getName = function() return name end }
end

local function fakeFolder(name, presets)
    return {
        getName = function() return name end,
        getDevelopPresets = function() return presets end,
    }
end

local function setup(opts)
    opts = opts or {}
    local catalog = helper.fakeCatalog({ photos = opts.photos or {} })
    local undoState = opts.undoState or { canUndo = true, canRedo = false, undoCount = 0, redoCount = 0 }
    helper.installImport({
        LrApplication = {
            activeCatalog = function() return catalog end,
            developPresetFolders = function() return opts.folders or {} end,
        },
        LrDevelopController = opts.developController or {
            getValue = function() return 0 end,
            setValue = function() end,
            getRange = function() return -100, 100 end,
            increment = function() end,
            decrement = function() end,
            resetToDefault = function() end,
            resetAllDevelopAdjustments = function() end,
            resetBrushing = function() end,
            resetCircularGradient = function() end,
            resetCrop = function() end,
            resetGradient = function() end,
            resetRedeye = function() end,
            resetSpotRemoval = function() end,
            resetTransforms = function() end,
            setAutoTone = function() end,
            setAutoWhiteBalance = function() end,
            getProcessVersion = function() return "11.0" end,
            setProcessVersion = function() end,
            getSelectedTool = function() return "loupe" end,
            revealPanel = function() end,
            selectTool = function() end,
            showClipping = function() end,
            toggleOverlay = function() end,
            startTracking = function() end,
            stopTracking = function() end,
            setTrackingDelay = function() end,
            setMultipleAdjustmentThreshold = function() end,
            revealAdjustedControls = function() end,
        },
        LrUndo = opts.undo or {
            canUndo = function() return undoState.canUndo end,
            canRedo = function() return undoState.canRedo end,
            undo = function()
                undoState.undoCount = undoState.undoCount + 1
                undoState.canUndo = false
                undoState.canRedo = true
            end,
            redo = function()
                undoState.redoCount = undoState.redoCount + 1
                undoState.canUndo = true
                undoState.canRedo = false
            end,
        },
        LrLogger = helper.defaultLrLogger(),
    })
    package.loaded.HandlerDevelop = nil
    _G.LightroomMCP_DevelopUndoStack = nil
    return catalog, require 'HandlerDevelop'
end

describe("HandlerDevelop.listDevelopPresets", function()
    it("returns flat list with name + folder", function()
        local folders = {
            fakeFolder("User Presets", { fakePreset("Vibrant"), fakePreset("Moody") }),
            fakeFolder("Adobe Color", { fakePreset("Standard") }),
        }
        local _, Handler = setup({ folders = folders })

        local r = Handler.listDevelopPresets({})

        assert.is_true(r.success)
        assert.are.equal(3, r.count)
        assert.are.equal(3, #r.presets)
        assert.are.equal("Vibrant", r.presets[1].name)
        assert.are.equal("User Presets", r.presets[1].folder)
        assert.are.equal("Standard", r.presets[3].name)
        assert.are.equal("Adobe Color", r.presets[3].folder)
    end)

    it("returns empty list when no folders", function()
        local _, Handler = setup({ folders = {} })
        local r = Handler.listDevelopPresets({})
        assert.are.equal(0, r.count)
        assert.are.same({}, r.presets)
    end)
end)

describe("HandlerDevelop.listDevelopSettingKeys", function()
    it("returns stable, raw, controller, and quick develop capabilities", function()
        local _, Handler = setup({})

        local r = Handler.listDevelopSettingKeys({})

        assert.is_true(r.success)
        assert.is_true(#r.stable_keys > 0)
        assert.is_true(#r.raw_known_keys >= #r.stable_keys)
        assert.is_true(#r.develop_controller_methods > 0)
        assert.is_true(#r.quick_develop_operations > 0)
    end)
end)

describe("HandlerDevelop.getDevelopSettingsRaw", function()
    it("returns the full develop settings table", function()
        local p = helper.fakePhoto({
            id = "1", path = "/a.jpg",
            developSettings = { Exposure2012 = 0.5, ToneCurvePV2012 = { 0, 0, 255, 255 } },
        })
        local _, Handler = setup({ photos = { p } })

        local r = Handler.getDevelopSettingsRaw({ photo_id = "1" })

        assert.is_true(r.success)
        assert.are.equal("1", r.photo_id)
        assert.are.equal(2, r.key_count)
        assert.are.equal(0.5, r.settings.Exposure2012)
        assert.are.same({ 0, 0, 255, 255 }, r.settings.ToneCurvePV2012)
    end)

    it("errors when photo is missing", function()
        local _, Handler = setup({})

        assert.has_error(function()
            Handler.getDevelopSettingsRaw({ photo_id = "missing" })
        end)
    end)
end)

describe("HandlerDevelop.setDevelopSettingsRaw", function()
    it("passes arbitrary SDK-shaped settings through", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg", developSettings = { Exposure2012 = 0.1 } })
        local _, Handler = setup({ photos = { p } })

        local r = Handler.setDevelopSettingsRaw({
            photo_ids = { "1" },
            settings = {
                UnknownFutureSetting = 3,
                ToneCurvePV2012 = { 0, 0, 128, 140, 255, 255 },
            },
        })

        assert.is_true(r.success)
        assert.are.equal(1, r.applied)
        assert.are.equal(2, r.key_count)
        assert.are.equal(3, p.getRawMetadata(p, "__appliedSettings").UnknownFutureSetting)
    end)

    it("rejects invalid raw setting values before catalog access", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local catalog, Handler = setup({ photos = { p } })

        assert.has_error(function()
            Handler.setDevelopSettingsRaw({
                photo_ids = { "1" },
                settings = { Bad = function() end },
            })
        end)

        assert.are.equal(0, catalog.getWriteAccessCount())
    end)
end)

describe("HandlerDevelop.adjustDevelopSettings", function()
    it("applies numeric deltas and clamps", function()
        local p = helper.fakePhoto({
            id = "1", path = "/a.jpg",
            developSettings = { Exposure2012 = 0.4, Highlights2012 = -90 },
        })
        local _, Handler = setup({ photos = { p } })

        local r = Handler.adjustDevelopSettings({
            photo_ids = { "1" },
            adjustments = { Exposure2012 = 0.2, Highlights2012 = -20 },
            clamp = { Highlights2012 = { min = -100, max = 100 } },
        })

        assert.is_true(r.success)
        assert.are.equal(1, r.applied)
        assert.are.equal(0.6, p.getRawMetadata(p, "__appliedSettings").Exposure2012)
        assert.are.equal(-100, p.getRawMetadata(p, "__appliedSettings").Highlights2012)
        assert.are.equal(0.4, r.photos[1].changes.Exposure2012.previous)
        assert.are.equal(0.6, r.photos[1].changes.Exposure2012.next)
    end)

    it("errors when a target setting is non-numeric", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg", developSettings = { WhiteBalance = "Custom" } })
        local _, Handler = setup({ photos = { p } })

        assert.has_error(function()
            Handler.adjustDevelopSettings({
                photo_ids = { "1" },
                adjustments = { WhiteBalance = 1 },
            })
        end)
    end)
end)

describe("HandlerDevelop.applyDevelopPreset", function()
    it("applies preset to resolved photos", function()
        local p1 = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local p2 = helper.fakePhoto({ id = "2", path = "/b.jpg" })
        local preset = fakePreset("Vibrant")
        local folders = { fakeFolder("User", { preset }) }
        local _, Handler = setup({ photos = { p1, p2 }, folders = folders })

        local r = Handler.applyDevelopPreset({ photo_ids = { "1", "2" }, preset_name = "Vibrant" })

        assert.is_true(r.success)
        assert.are.equal(2, r.applied)
        assert.are.equal("Vibrant", r.preset)
        assert.are.equal("User", r.folder)
        assert.are.equal(preset, p1.getRawMetadata(p1, "__appliedPreset"))
        assert.are.equal(preset, p2.getRawMetadata(p2, "__appliedPreset"))
    end)

    it("skips unresolved photos", function()
        local p1 = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local folders = { fakeFolder("User", { fakePreset("Moody") }) }
        local _, Handler = setup({ photos = { p1 }, folders = folders })

        local r = Handler.applyDevelopPreset({ photo_ids = { "1", "missing" }, preset_name = "Moody" })

        assert.are.equal(1, r.applied)
    end)

    it("errors on unknown preset", function()
        local p1 = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local folders = { fakeFolder("User", { fakePreset("Vibrant") }) }
        local _, Handler = setup({ photos = { p1 }, folders = folders })

        assert.has_error(function()
            Handler.applyDevelopPreset({ photo_ids = { "1" }, preset_name = "Nope" })
        end)
    end)

    it("requires photo_ids and preset_name", function()
        local catalog, Handler = setup({ folders = { fakeFolder("U", { fakePreset("X") }) } })
        assert.has_error(function() Handler.applyDevelopPreset({ preset_name = "X" }) end)
        assert.has_error(function() Handler.applyDevelopPreset({ photo_ids = { "1" } }) end)
        assert.has_error(function() Handler.applyDevelopPreset({ photo_ids = {}, preset_name = "X" }) end)
        assert.has_error(function() Handler.applyDevelopPreset({ photo_ids = { "" }, preset_name = "X" }) end)
        assert.are.equal(0, catalog.getWriteAccessCount())
    end)
end)

describe("HandlerDevelop.createDevelopSnapshot", function()
    it("creates snapshots and reports existing-name skips", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local _, Handler = setup({ photos = { p } })

        local first = Handler.createDevelopSnapshot({ photo_ids = { "1" }, name = "Before MCP" })
        local second = Handler.createDevelopSnapshot({ photo_ids = { "1" }, name = "Before MCP" })

        assert.are.equal(1, first.created)
        assert.are.equal(0, first.skipped)
        assert.are.equal(0, second.created)
        assert.are.equal(1, second.skipped)
    end)
end)

describe("HandlerDevelop.copyDevelopSettings", function()
    it("copies all settings from source to targets", function()
        local source = helper.fakePhoto({
            id = "10", path = "/s.jpg",
            developSettings = { Exposure2012 = 1.0, Contrast2012 = 25, WhiteBalance = "Custom" },
        })
        local t1 = helper.fakePhoto({ id = "11", path = "/t1.jpg" })
        local t2 = helper.fakePhoto({ id = "12", path = "/t2.jpg" })
        local _, Handler = setup({ photos = { source, t1, t2 } })

        local r = Handler.copyDevelopSettings({ source_id = "10", target_ids = { "11", "12" } })

        assert.is_true(r.success)
        assert.are.equal(2, r.copied)
        assert.are.same(
            { Exposure2012 = 1.0, Contrast2012 = 25, WhiteBalance = "Custom" },
            t1.getRawMetadata(t1, "__appliedSettings")
        )
        assert.are.same(
            { Exposure2012 = 1.0, Contrast2012 = 25, WhiteBalance = "Custom" },
            t2.getRawMetadata(t2, "__appliedSettings")
        )
    end)

    it("filters by settings whitelist", function()
        local source = helper.fakePhoto({
            id = "20", path = "/s.jpg",
            developSettings = { Exposure2012 = 0.5, Contrast2012 = 10, Saturation = 20 },
        })
        local target = helper.fakePhoto({ id = "21", path = "/t.jpg" })
        local _, Handler = setup({ photos = { source, target } })

        Handler.copyDevelopSettings({
            source_id = "20",
            target_ids = { "21" },
            settings = { "Exposure2012", "Saturation" },
        })

        local applied = target.getRawMetadata(target, "__appliedSettings")
        assert.are.equal(0.5, applied.Exposure2012)
        assert.are.equal(20, applied.Saturation)
        assert.is_nil(applied.Contrast2012)
    end)

    it("errors when source missing", function()
        local _, Handler = setup({ photos = {} })
        assert.has_error(function()
            Handler.copyDevelopSettings({ source_id = "missing", target_ids = { "t" } })
        end)
    end)

    it("requires source_id and target_ids", function()
        local catalog, Handler = setup({})
        assert.has_error(function() Handler.copyDevelopSettings({ target_ids = { "t" } }) end)
        assert.has_error(function() Handler.copyDevelopSettings({ source_id = "s" }) end)
        assert.has_error(function() Handler.copyDevelopSettings({ source_id = "s", target_ids = {} }) end)
        assert.has_error(function() Handler.copyDevelopSettings({ source_id = "s", target_ids = { "" } }) end)
        assert.are.equal(0, catalog.getWriteAccessCount())
    end)

    it("rejects invalid settings whitelist before catalog access", function()
        local source = helper.fakePhoto({
            id = "20", path = "/s.jpg",
            developSettings = { Exposure2012 = 0.5 },
        })
        local target = helper.fakePhoto({ id = "21", path = "/t.jpg" })
        local catalog, Handler = setup({ photos = { source, target } })

        assert.has_error(function()
            Handler.copyDevelopSettings({
                source_id = "20",
                target_ids = { "21" },
                settings = { "UnsupportedSetting" },
            })
        end)

        assert.are.equal(0, catalog.getReadAccessCount())
        assert.are.equal(0, catalog.getWriteAccessCount())
    end)
end)

describe("HandlerDevelop.applyDevelopSettingsToSelected", function()
    it("copies the first selected photo settings to other selected photos", function()
        local source = helper.fakePhoto({
            id = "1", path = "/source.jpg",
            developSettings = { Exposure2012 = 0.8, Contrast2012 = 10 },
        })
        local target = helper.fakePhoto({ id = "2", path = "/target.jpg" })
        local catalog = helper.fakeCatalog({ photos = { source, target }, targetPhotos = { source, target } })
        helper.installImport({
            LrApplication = {
                activeCatalog = function() return catalog end,
                developPresetFolders = function() return {} end,
            },
            LrDevelopController = {
                getValue = function() return 0 end,
            },
            LrUndo = {
                canUndo = function() return false end,
                canRedo = function() return false end,
            },
            LrLogger = helper.defaultLrLogger(),
        })
        package.loaded.HandlerDevelop = nil
        _G.LightroomMCP_DevelopUndoStack = nil
        local Handler = require 'HandlerDevelop'

        local r = Handler.applyDevelopSettingsToSelected({})

        assert.is_true(r.success)
        assert.are.equal(1, r.copied)
        assert.are.equal("1", r.source)
        assert.are.same({ "2" }, r.target_ids)
        assert.are.equal(0.8, target.getRawMetadata(target, "__appliedSettings").Exposure2012)
        assert.is_nil(source.getRawMetadata(source, "__appliedSettings"))
    end)

    it("copies only requested raw setting keys when provided", function()
        local source = helper.fakePhoto({
            id = "1", path = "/source.jpg",
            developSettings = { Exposure2012 = 0.8, Contrast2012 = 10 },
        })
        local target = helper.fakePhoto({ id = "2", path = "/target.jpg" })
        local catalog = helper.fakeCatalog({ photos = { source, target }, targetPhotos = { source, target } })
        helper.installImport({
            LrApplication = {
                activeCatalog = function() return catalog end,
                developPresetFolders = function() return {} end,
            },
            LrDevelopController = {
                getValue = function() return 0 end,
            },
            LrUndo = {
                canUndo = function() return false end,
                canRedo = function() return false end,
            },
            LrLogger = helper.defaultLrLogger(),
        })
        package.loaded.HandlerDevelop = nil
        _G.LightroomMCP_DevelopUndoStack = nil
        local Handler = require 'HandlerDevelop'

        Handler.applyDevelopSettingsToSelected({ settings = { "Contrast2012" } })

        local applied = target.getRawMetadata(target, "__appliedSettings")
        assert.is_nil(applied.Exposure2012)
        assert.are.equal(10, applied.Contrast2012)
    end)
end)

describe("HandlerDevelop.setDevelopSettings", function()
    it("applies settings to the photo", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local _, Handler = setup({ photos = { p } })

        local r = Handler.setDevelopSettings({
            photo_id = "1",
            settings = { Exposure2012 = 0.75, Contrast2012 = 15 },
        })

        assert.is_true(r.success)
        assert.are.same(
            { Exposure2012 = 0.75, Contrast2012 = 15 },
            p.getRawMetadata(p, "__appliedSettings")
        )
    end)

    it("errors when photo not found", function()
        local _, Handler = setup({ photos = {} })
        assert.has_error(function()
            Handler.setDevelopSettings({ photo_id = "missing", settings = { Exposure2012 = 1 } })
        end)
    end)

    it("requires photo_id and settings table", function()
        local catalog, Handler = setup({})
        assert.has_error(function() Handler.setDevelopSettings({ settings = {} }) end)
        assert.has_error(function() Handler.setDevelopSettings({ photo_id = "1" }) end)
        assert.has_error(function() Handler.setDevelopSettings({ photo_id = "1", settings = "not-a-table" }) end)
        assert.are.equal(0, catalog.getWriteAccessCount())
    end)

    it("rejects unsupported setting keys before catalog write", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local catalog, Handler = setup({ photos = { p } })

        assert.has_error(function()
            Handler.setDevelopSettings({
                photo_id = "1",
                settings = { UnsupportedSetting = 1 },
            })
        end)

        assert.are.equal(0, catalog.getWriteAccessCount())
        assert.is_nil(p.getRawMetadata(p, "__appliedSettings"))
    end)

    it("rejects unsupported setting values before catalog write", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local catalog, Handler = setup({ photos = { p } })

        assert.has_error(function()
            Handler.setDevelopSettings({
                photo_id = "1",
                settings = { Exposure2012 = { nested = true } },
            })
        end)

        assert.are.equal(0, catalog.getWriteAccessCount())
        assert.is_nil(p.getRawMetadata(p, "__appliedSettings"))
    end)
end)

describe("HandlerDevelop.quickDevelop", function()
    it("calls quickDevelopAdjustImage with string or numeric size", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local _, Handler = setup({ photos = { p } })

        local r = Handler.quickDevelop({
            photo_ids = { "1" },
            operation = "adjust_image",
            setting_name = "Exposure",
            size = "small",
        })

        assert.is_true(r.success)
        assert.are.equal(1, r.applied)
        assert.are.equal("adjust_image", p.getRawMetadata(p, "__quickDevelop")[1].op)
        assert.are.equal("Exposure", p.getRawMetadata(p, "__quickDevelop")[1].settingName)
        assert.are.equal("small", p.getRawMetadata(p, "__quickDevelop")[1].size)
    end)

    it("calls quickDevelopSetWhiteBalance", function()
        local p = helper.fakePhoto({ id = "1", path = "/a.jpg" })
        local _, Handler = setup({ photos = { p } })

        Handler.quickDevelop({
            photo_ids = { "1" },
            operation = "set_white_balance",
            value = "Auto",
        })

        assert.are.equal("set_white_balance", p.getRawMetadata(p, "__quickDevelop")[1].op)
        assert.are.equal("Auto", p.getRawMetadata(p, "__quickDevelop")[1].value)
    end)
end)

describe("HandlerDevelop.undoLastMcpDevelopEdit", function()
    it("restores settings captured before an MCP develop write", function()
        local p = helper.fakePhoto({
            id = "1", path = "/a.jpg",
            developSettings = { Exposure2012 = 0.1, Contrast2012 = 5 },
        })
        local _, Handler = setup({ photos = { p } })

        Handler.setDevelopSettingsRaw({
            photo_ids = { "1" },
            settings = { Exposure2012 = 1.2 },
        })
        local r = Handler.undoLastMcpDevelopEdit({})

        assert.is_true(r.success)
        assert.are.equal(1, r.restored)
        assert.are.equal("Set Raw Develop Settings", r.label)
        assert.are.same({ Exposure2012 = 0.1, Contrast2012 = 5 }, p.getRawMetadata(p, "__appliedSettings"))
    end)

    it("errors when there is no MCP edit to undo", function()
        local _, Handler = setup({})

        assert.has_error(function()
            Handler.undoLastMcpDevelopEdit({})
        end)
    end)
end)

describe("HandlerDevelop Lightroom global undo/redo", function()
    it("reports undo status and invokes undo", function()
        local state = { canUndo = true, canRedo = false, undoCount = 0, redoCount = 0 }
        local _, Handler = setup({ undoState = state })

        local status = Handler.lightroomUndoStatus({})
        local r = Handler.lightroomUndo({})

        assert.is_true(status.can_undo)
        assert.is_true(r.success)
        assert.are.equal(1, state.undoCount)
        assert.is_false(r.can_undo)
        assert.is_true(r.can_redo)
    end)
end)

describe("HandlerDevelop.developControllerCall", function()
    it("sets and gets develop controller values", function()
        local calls = {}
        local controller = {
            getValue = function(param)
                table.insert(calls, { method = "getValue", param = param })
                return 0.25
            end,
            setValue = function(param, value)
                table.insert(calls, { method = "setValue", param = param, value = value })
            end,
            getRange = function() return -5, 5 end,
            increment = function() end,
            decrement = function() end,
            resetToDefault = function() end,
            resetAllDevelopAdjustments = function() end,
            resetBrushing = function() end,
            resetCircularGradient = function() end,
            resetCrop = function() end,
            resetGradient = function() end,
            resetRedeye = function() end,
            resetSpotRemoval = function() end,
            resetTransforms = function() end,
            setAutoTone = function() end,
            setAutoWhiteBalance = function() end,
            getProcessVersion = function() return "11.0" end,
            setProcessVersion = function() end,
            getSelectedTool = function() return "loupe" end,
            revealPanel = function() end,
            selectTool = function() end,
            showClipping = function() end,
            toggleOverlay = function() end,
            startTracking = function() end,
            stopTracking = function() end,
            setTrackingDelay = function() end,
            setMultipleAdjustmentThreshold = function() end,
            revealAdjustedControls = function() end,
        }
        local _, Handler = setup({ developController = controller })

        local getResult = Handler.developControllerCall({ method = "get_value", param = "Exposure" })
        local setResult = Handler.developControllerCall({ method = "set_value", param = "Exposure", value = 0.5 })

        assert.are.equal(0.25, getResult.value)
        assert.is_true(setResult.success)
        assert.are.equal("getValue", calls[1].method)
        assert.are.equal("setValue", calls[2].method)
        assert.are.equal(0.5, calls[2].value)
    end)
end)

const Settings = require("../models/Settings");

/**
 * @desc    Get public site settings (feature toggles)
 * @route   GET /api/settings
 * @access  Public
 */
exports.getPublicSettings = async (req, res, next) => {
    try {
        const settings = await Settings.getSingleton();
        res.status(200).json({
            success: true,
            data: {
                emergenciesEnabled: settings.emergenciesEnabled,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update site settings (feature toggles)
 * @route   PATCH /api/admin/settings
 * @access  Private/Admin
 */
exports.updateSettings = async (req, res, next) => {
    try {
        const { emergenciesEnabled } = req.body;
        const settings = await Settings.getSingleton();

        if (typeof emergenciesEnabled === "boolean") {
            settings.emergenciesEnabled = emergenciesEnabled;
        }

        await settings.save();

        res.status(200).json({
            success: true,
            message: "Configuración actualizada",
            data: {
                emergenciesEnabled: settings.emergenciesEnabled,
            },
        });
    } catch (error) {
        next(error);
    }
};

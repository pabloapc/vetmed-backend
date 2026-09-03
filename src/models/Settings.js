const mongoose = require("mongoose");

// Singleton document holding global, admin-configurable feature toggles.
const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: "global",
            unique: true,
        },
        emergenciesEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

settingsSchema.statics.getSingleton = async function () {
    let settings = await this.findOne({ key: "global" });
    if (!settings) {
        settings = await this.create({ key: "global" });
    }
    return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);

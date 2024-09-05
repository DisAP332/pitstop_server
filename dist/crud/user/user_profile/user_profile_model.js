"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize_2 = __importDefault(require("../../../db/sequelize"));
const user_model_1 = __importDefault(require("../user_model"));
class UserProfile extends sequelize_1.Model {
}
UserProfile.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: "id",
        },
        onDelete: "CASCADE", // if a user is deleted, also delete their profile
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    location: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    websiteUrl: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    amazonWishlist: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    sequelize: sequelize_2.default,
    tableName: "user_profiles",
});
UserProfile.belongsTo(user_model_1.default, { foreignKey: "userId", as: "user" });
user_model_1.default.hasOne(UserProfile, { foreignKey: "userId", as: "profile" });
exports.default = UserProfile;

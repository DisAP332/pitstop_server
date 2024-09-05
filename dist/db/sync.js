"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("./sequelize"));
const connectToDatabase = async () => {
    try {
        // Authenticate the connection
        await sequelize_1.default.authenticate();
        console.log("Connected to PostgreSQL database with Sequelize.");
        // Synchronize models
        await sequelize_1.default.sync();
        console.log("All models were synchronized successfully.");
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
    }
};
exports.default = connectToDatabase;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
//**************************************************************************\\
// Create a new Sequelize instance
const sequelize = new sequelize_1.Sequelize(process.env.DB_NAME, process.env.USERNAME_DB, process.env.PASSWORD_DB, {
    host: process.env.HOST_DB,
    port: parseInt(process.env.PORT_DB || "5432", 10),
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: true,
            ca: fs_1.default
                .readFileSync(path_1.default.join(__dirname, "ca-certificate.crt"))
                .toString(),
        },
    },
    logging: false, // Disable logging; default: console.log
});
exports.default = sequelize;

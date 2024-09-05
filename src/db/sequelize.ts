import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";

//**************************************************************************\\

// Create a new Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.USERNAME_DB as string,
  process.env.PASSWORD_DB,
  {
    host: process.env.HOST_DB,
    port: parseInt(process.env.PORT_DB || "5432", 10),
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs
          .readFileSync(path.join(__dirname, "ca-certificate.crt"))
          .toString(),
      },
    },
    logging: false, // Disable logging; default: console.log
  }
);

export default sequelize;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Client } = require("pg");
const client = new Client({
  user: process.env.USERNAME_DB,
  password: process.env.PASSWORD_DB,
  host: process.env.HOST_DB,
  port: process.env.PORT_DB,
  database: process.env.DB_NAME,
});
const connect = () => {
  client
    .connect()
    .then(() => {
      console.log("Connected to PostgreSQL database");
    })
    .catch((err) => {
      console.log(client);
      console.error("Error connecting to PostgreSQL database", err);
    });
};
// Example query
// client.query("SELECT NOW()", (err: Error, res: any) => {
//   if (err) {
//     console.error("Query error", err.stack);
//   } else {
//     console.log("Query result:", res.rows);
//   }
//   // Close the connection
//   client.end();
// });
const db_methods = {
  connect,
};
exports.default = db_methods;

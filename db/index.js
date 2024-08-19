"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Client } = require("pg");
const client = new Client({
    user: "doadmin",
    password: "AVNS_h-9q6TuL2ZVoLCYnzXo",
    host: "db-pitstop-do-user-14443352-0.g.db.ondigitalocean.com",
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

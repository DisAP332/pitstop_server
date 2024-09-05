"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Client } = require("pg");
const fs = require("node:fs");
const client = new Client({
    user: process.env.USERNAME_DB,
    password: process.env.PASSWORD_DB,
    host: process.env.HOST_DB,
    port: process.env.PORT_DB,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(__dirname + "/ca-certificate.crt").toString(),
    },
});
const connect = () => {
    client
        .connect()
        .then(() => {
        console.log("Connected to PostgreSQL database");
    })
        .catch((err) => {
        console.error("Error connecting to PostgreSQL database", err);
    });
};
console.log("hellos");
const insert = (table, columns, values) => {
    // spread operator didnt work for columns may cause issues.
    client.query(`INSERT INTO "${table}" (${columns}) VALUES (${values})`, (err, res) => {
        if (err) {
            console.error("Query error", err.stack);
        }
        else {
            console.log("Query result:", res.rows);
        }
        // Close the connection
        client.end();
    });
};
const db_methods = {
    connect,
    insert,
};
exports.default = db_methods;

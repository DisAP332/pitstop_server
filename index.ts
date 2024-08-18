const express = require("express");
const https = require("https");
const http = rquire("http");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./db");

const app = express();

const httpPort = 8080;
const httpsPort = 8443;

app.use(cors());
app.use(express.json());

app.use("/", (req, res, next) => {
  res.send("Hello from SSL server");
});

db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Begin call of routers

const eventsRouter = require("./Routes/eventsRouter");
const drinksRouter = require("./Routes/drinksRouter");

// End call of routers

app.use("/events", eventsRouter);
app.use("/drinks", drinksRouter);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(app);

app.listen(httpPort, () => {
  console.log(`Http server is running on port ${httpPort}`);
});

app.listen(httpsPort, () => {
  console.log(`Https server is running on port ${httpsPort}`);
});

module.exports = app;

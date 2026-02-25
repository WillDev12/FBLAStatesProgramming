// Entry point for the Express backend server.
// Mounts user auth routes at /user and business data routes at /data,
// then starts listening on port 3000.

const express = require("express");
const app = express();

const userApi = require("./api/user");
const dataApi = require("./api/data");

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userApi);
app.use("/data", dataApi);

app.listen(3000, () => console.log("Listening on 3000"));

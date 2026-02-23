const express = require("express");
const app = express();

const userApi = require("./api/user");
const dataApi = require("./api/data");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userApi);
app.use("/data", dataApi);

app.listen(3000, () => console.log("Listening on 3000"));

/* 
Credit to: WillDev12 (2026)
Ohio FBLA States Submission
See libraries.txt for information regarding 
*/

const path = require("path");
require("dotenv").config({ path: path.join(path.dirname(process.execPath), '.env'), quiet: true });

const blessed = require("neo-blessed");
const loginForm = require("./screens/login.js");
const launchSearch = require("./api/search.js");
const requestData = require("./api/requestData.js");
const api = require("./api/requestAPI.js");

let uuid, name;

const screen = blessed.screen({
  smartCSR: true,
  title: "LocalSearch",
  ignoreLocked: ["C-q", "C-c", "escape", "C-enter"],
});

const container = blessed.box({
  width: "100%",
  height: "100%",
  parent: screen,
});

function clearContainer() {
  container.focus();

  // Iterate backwards to avoid index shifting during removal
  for (let i = container.children.length - 1; i >= 0; i--) {
    container.children[i].destroy();
  }
  screen.render();
}

function dataError(message) {
  screen.destroy();
  console.error(message);
}

var commands = {
  Next: { keys: ["tab"] },
  Submit: { keys: ["enter"] },
  Quit: { keys: ["ctrl+q"] },
};

const menu = blessed.listbar({
  bottom: 0,
  left: 0,
  width: "100%",
  height: "shrink",
  keys: true,
  autoCommandKeys: false,
  style: {
    item: { bg: "black", fg: "white" },
    selected: { bg: "blue", fg: "white" },
  },
  commands: commands,
});

container.on("clear", () => clearContainer());

container.on("creation", async (data) => {
  const { name, description, areaCode, category } = data;
  const request = {
    name: name,
    areacode: areaCode,
    category: category,
    description: description,
    auth: uuid,
  };

  try {
    const response = await api.post("/data/business/new", request);

    if (response.statusCode >= 400) throw new Error("Internal server error.");

    const businesses = await requestData(uuid, screen);

    launchSearch(container, screen, commands, menu, businesses);
  } catch (e) {
    dataError("Internal server error. (home)");
  }

});

container.on("comment", async (data) => {
  const { comment, stars, businessName } = data;
  const request = {
    business: businessName,
    comment: comment,
    rating: stars,
    auth: uuid,
  };

  try {
    const response = await api.post("/data/comment", request);

    if (response.statusCode >= 400)
      throw new Error("Problem contacting server.");

    const businesses = await requestData(uuid, screen);

    container.emit("comment-refresh", { businessName, businesses });
  } catch (e) {
    dataError("Internal server error. (home)");
    console.log(request);
    console.log(request.data);
  }
});

require("./api/loginHandler.js")(screen, container, commands, menu);

loginForm.login(container);

container.on("login", async (data) => {
  uuid = data.uuid;
  name = data.name;

  responseData = await requestData(uuid, screen);

  launchSearch(container, screen, commands, menu, responseData, name, data.verified);
});

container.on("signup", async (data) => {
  uuid = data.uuid;
  name = data.name;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  responseData = await requestData(uuid, screen);

  launchSearch(container, screen, commands, menu, responseData, name, data.verified);
});

screen.key(["C-c", "C-q"], () => process.exit(0));

screen.append(menu);
screen.render();

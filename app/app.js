const blessed = require("neo-blessed");
const loginForm = require("./screens/login.js");
const launchSearch = require("./api/search.js");
const requestData = require("./api/requestData.js");

let uuid;

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

  // Loop backwards to avoid index shifting issues during destruction
  for (let i = container.children.length - 1; i >= 0; i--) {
    container.children[i].destroy();
  }
  screen.render();
}

require("./api/loginHandler.js")(screen, container);

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

container.on("creation", (data) => {
  screen.destroy();
  console.log(data);
});

container.on("comment", (data) => {
  screen.destroy();
  console.log(data);
});

// loginForm.login(container);

loginForm.login(container);

container.on("login", async (data) => {
  uuid = data.uuid;

  responseData = await requestData(uuid, screen);

  console.log(responseData);
  // launchSearch(container, screen, commands, menu);
});

container.on("signup", (data) => {
  uuid = data.uuid;
  launchSearch(container, screen, commands, menu);
});

screen.key(["C-c", "C-q"], () => process.exit(0));

screen.append(menu);
screen.render();

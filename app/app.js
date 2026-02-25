/* 
Credit to: WillDev12 (2026)
Ohio FBLA States Submission
See libraries.txt for information regarding 
*/

// Main entry point for the terminal UI.
// Sets up the blessed screen and root container, registers all global event
// handlers, then launches the login form to start the app.

const blessed = require("neo-blessed");
const loginForm = require("./screens/login.js");
const launchSearch = require("./api/search.js");
const requestData = require("./api/requestData.js");
const api = require("./api/requestAPI.js");

// Session state — populated after a successful login or signup
let uuid, name;

// Create the top-level blessed screen
const screen = blessed.screen({
  smartCSR: true,
  title: "LocalSearch",
  ignoreLocked: ["C-q", "C-c", "escape", "C-enter"],
});

// Root container that all UI screens are mounted inside
const container = blessed.box({
  width: "100%",
  height: "100%",
  parent: screen,
});

// Destroys all children of the container so a new screen can be rendered
function clearContainer() {
  container.focus();

  // Iterate backwards to avoid index shifting during removal
  for (let i = container.children.length - 1; i >= 0; i--) {
    container.children[i].destroy();
  }
  screen.render();
}

// Tears down the terminal UI and logs an error to the console
function dataError(message) {
  screen.destroy();
  console.error(message);
}

// Register login/signup transition and verification handlers
require("./api/loginHandler.js")(screen, container);

// Keyboard shortcut labels shown in the bottom menu bar
var commands = {
  Next: { keys: ["tab"] },
  Submit: { keys: ["enter"] },
  Quit: { keys: ["ctrl+q"] },
};

// Bottom menu bar displaying available keyboard shortcuts
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

// "clear" — wipe all child widgets from the container
container.on("clear", () => clearContainer());

// "creation" — user submitted the List Business form; POST to the API then
// refresh the business list and return to the search screen
container.on("creation", async (data) => {
  const { name, stars, areaCode, category } = data;
  const request = {
    name: name,
    areacode: areaCode,
    category: category,
    description: stars,
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

// "comment" — user submitted the Add Comment form; POST the review to the API
// then refresh and return to the search screen
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

    launchSearch(container, screen, commands, menu, businesses);
  } catch (e) {
    dataError("Internal server error. (home)");
    console.log(request);
    console.log(request.data);
  }
});

// Show the login screen on startup
loginForm.login(container);

// "login" — fired after successful login verification; store session info
// and load the search screen
container.on("login", async (data) => {
  uuid = data.uuid;
  name = data.name;

  responseData = await requestData(uuid, screen);

  launchSearch(container, screen, commands, menu, responseData);
});

// "signup" — fired after successful signup verification; brief delay to allow
// the server to finish writing the new user, then load the search screen
container.on("signup", async (data) => {
  uuid = data.uuid;
  name = data.name;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  responseData = await requestData(uuid, screen);

  launchSearch(container, screen, commands, menu, responseData);
});

// Ctrl+C or Ctrl+Q quits the application
screen.key(["C-c", "C-q"], () => process.exit(0));

screen.append(menu);
screen.render();

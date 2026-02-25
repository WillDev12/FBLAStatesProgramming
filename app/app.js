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

  // Loop backwards to avoid index shifting issues during destruction
  for (let i = container.children.length - 1; i >= 0; i--) {
    container.children[i].destroy();
  }
  screen.render();
}

function dataError(message) {
  screen.destroy();
  console.error(message);
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

// { name, description, areacode, category, auth }
// {
//   name: 'Test Business',
//   areaCode: '44223',
//   category: 'Anthropology',
//   stars: 'This is a test business that is made to test the object.'
// }
container.on("creation", async (data) => {
  const {name, stars, areaCode, category} = data;
  const request = {
    name: name,
    areacode: areaCode,
    category: category,
    description: stars,
    auth: uuid,
  };

  try {
    const response = await api.post("/data/business/new", request);
    // let data = response.data || {};

    if (response.statusCode >= 400)
      throw new Error("Internal server error.");

    const businesses = await requestData(uuid, screen);
    
    launchSearch(container, screen, commands, menu, businesses);
  } catch (e) {
    dataError("Internal server error. (home)");
  }
  // screen.destroy();
  // console.log(data);
});

//{ comment: 'hello world', stars: '5', button: true, businessName: "name" }
container.on("comment", async (data) => {
  const {comment, stars, businessName} = data;
  const request = {
    "business": businessName, 
    "comment": comment, 
    "rating": stars,
    "auth": uuid
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

loginForm.login(container);

container.on("login", async (data) => {
  uuid = data.uuid;
  name = data.name;

  responseData = await requestData(uuid, screen);

  // console.log(responseData);
  launchSearch(container, screen, commands, menu, responseData);
});

container.on("signup", async (data) => {
  uuid = data.uuid;
  name = data.name;

  await new Promise(resolve => setTimeout(resolve, 2000));

  responseData = await requestData(uuid, screen);

  // console.log(responseData);
  launchSearch(container, screen, commands, menu, responseData);
});

screen.key(["C-c", "C-q"], () => process.exit(0));

screen.append(menu);
screen.render();

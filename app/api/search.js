const searchForm = require("../screens/searchForm.js");
const resultsForm = require("../screens/results.js");
const visualError = require("../modules/error.js");
const { loremIpsum } = require("lorem-ipsum");

let data = {
  Telecom: {
    description: loremIpsum({ count: 5 }),
    areaCode: 44012,
    category: "electricity",
    reviews: [
      { user: "willdev12", comment: "Hello, world!", stars: 4 },
      { user: "willdev12", comment: "Here's my second comment!", stars: 5 },
    ],
    avg: "4.0",
    owner: "willdev12",
  },
  "Business 2": {
    description: loremIpsum({ count: 5 }),
    areaCode: 44012,
    category: "anthropology",
    reviews: [
      {
        user: "Needleinahaystack",
        comment: "Oh brother, these guys screwed me up!",
        stars: 1,
      },
      { user: "Dudeman12", comment: "0/10, they suck.", stars: 0 },
    ],
    avg: "0.5",
    owner: "willdev12",
  },
};

let cmds, men;

function launchSearch(container, screen, commands, menu) {
  container.emit("clear");
  container.removeListener("re-search", moveBack);

  const listformData = { commands, menu };

  const searchFormObject = searchForm(container, screen, listformData);
  const thisSearchForm = searchFormObject.searchForm;
  const searchFormReturn = searchFormObject.name;
  cmds = commands;
  men = menu;

  setImmediate(() => {
    if (!searchFormReturn.destroyed) {
      searchFormReturn.focus();
      screen.render();
    }
  });

  thisSearchForm.on("submit", (results) => {
    const { name, areaCode, category } = results;
    let filteredData = data;

    // Stars range
    if (results.stars != "")
      filteredData = Object.fromEntries(
        Object.entries(filteredData).filter(([key, value]) => {
          let starsRange = results.stars,
            starsLower,
            starsUpper;
          let noRange = true;

          if (starsRange.includes("-")) {
            starsLower = parseFloat(starsRange.split("-")[0]);
            starsUpper = parseFloat(starsRange.split("-")[1]);
            noRange = false;
          } else starsRange = parseFloat(starsRange);
          const num = parseFloat(value.avg);

          if (noRange) {
            return num === starsRange;
          } else {
            return num >= starsLower && num <= starsUpper;
          }
        })
      );

    // Handle Category

    if (category != "None")
      filteredData = Object.fromEntries(
        Object.entries(filteredData).filter(
          ([key, value]) =>
            value.category.toLowerCase() === category.toLowerCase()
        )
      );

    if (areaCode != "")
      filteredData = Object.fromEntries(
        Object.entries(filteredData).filter(
          ([key, value]) => value.areaCode === parseInt(areaCode)
        )
      );

    if (name != "") {
      const lowerName = name.toLowerCase();

      filteredData = Object.fromEntries(
        Object.entries(filteredData).filter(([key, value]) => {
          const lowerVal = key.toLowerCase();

          return lowerVal.includes(lowerName);
        })
      );
    }

    if (Object.keys(filteredData).length === 0) {
      visualError("No results found.", screen, searchFormReturn);
      return false;
    }

    container.emit("clear");
    resultsForm.initiate(filteredData);
    resultsForm.build(container, screen);

    cmds.Back = { keys: ["esc"] };
    menu.setItems(cmds);

    container.once("re-search", moveBack);

    screen.render();
  });

  function moveBack() {
    delete cmds.Back;
    men.setItems(cmds);
    launchSearch(container, screen, commands, menu);
  }
}

module.exports = launchSearch;

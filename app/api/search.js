const searchForm = require("../screens/searchForm.js");
const resultsForm = require("../screens/results.js");
const visualError = require("../modules/error.js");

let currentData = {};
let currentName = "";
let currentVerified = false;
let moveBackHandler = null;

function launchSearch(container, screen, commands, menu, logindata, username, verified) {
  screen.removeAllListeners("key tab");
  screen.removeAllListeners("key escape");

  container.emit("clear");

  commands.Submit.keys = ["enter"];
  delete commands.Back;

  menu.setItems(commands);

  container.removeAllListeners("re-search");
  container.removeAllListeners("comment-refresh");

  if (logindata) currentData = logindata;
  if (username) currentName = username;
  if (verified !== undefined) currentVerified = verified;

  const listformData = { commands, menu, name: currentName, verified: currentVerified };

  setTimeout(() => {
    const searchFormObject = searchForm(container, screen, listformData);
    const thisSearchForm = searchFormObject.searchForm;
    const searchFormReturn = searchFormObject.name;

    if (!searchFormReturn.destroyed) {
      searchFormReturn.focus();
      screen.render();
    }

    function searchSubmitHandler(results) {
      let filteredData = currentData;
      const { name, areaCode, category } = results;

      if (results.stars !== "") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(([key, value]) => {
            let starsRange = results.stars;
            let starsLower, starsUpper;
            let noRange = true;

            if (starsRange.includes("-")) {
              const parts = starsRange.split("-").map(parseFloat);
              starsLower = Math.min(...parts);
              starsUpper = Math.max(...parts);
              noRange = false;
            } else {
              starsRange = parseFloat(starsRange);
            }

            const num = parseFloat(value.avg);

            return noRange
              ? num === starsRange
              : num >= starsLower && num <= starsUpper;
          }),
        );
      }

      if (category !== "None") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) =>
              value.category.toLowerCase() === category.toLowerCase(),
          ),
        );
      }

      if (areaCode !== "") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) => value.areaCode === parseInt(areaCode),
          ),
        );
      }

      if (name !== "") {
        const lowerName = name.toLowerCase();
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(([key]) =>
            key.toLowerCase().includes(lowerName),
          ),
        );
      }

      if (Object.keys(filteredData).length === 0) {
        visualError("No results found.", screen, searchFormReturn);
        return;
      }

      thisSearchForm.removeListener("submit", searchSubmitHandler);
      container.emit("clear");

      resultsForm.initiate(filteredData);
      resultsForm.build(container, screen);

      commands.Back = { keys: ["esc"] };
      menu.setItems(commands);

      const commentRefreshHandler = ({ businesses }) => {
        currentData = businesses;
      };
      container.on("comment-refresh", commentRefreshHandler);

      moveBackHandler = () => {
        container.removeListener("comment-refresh", commentRefreshHandler);
        delete commands.Back;
        menu.setItems(commands);
        launchSearch(container, screen, commands, menu, currentData);
      };

      container.once("re-search", moveBackHandler);
    }
    thisSearchForm.on("submit", searchSubmitHandler);

    screen.render();
  }, 500);
}

module.exports = launchSearch;

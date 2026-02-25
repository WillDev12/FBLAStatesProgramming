const searchForm = require("../screens/searchForm.js");
const resultsForm = require("../screens/results.js");
const visualError = require("../modules/error.js");

let currentData = {};
let moveBackHandler = null;

function launchSearch(container, screen, commands, menu, logindata) {

  screen.removeAllListeners("key tab");
  screen.removeAllListeners("key escape");
  // Always clear UI safely
  container.emit("clear");

  commands.Submit.keys = ["enter"];  // reset before relaunching
  delete commands.Back;

  menu.setItems(commands);

  // Remove ALL previous re-search listeners (prevents leak)
  container.removeAllListeners("re-search");

  // Update stored data when new data is provided
  if (logindata) {
    currentData = logindata;
  }

  const listformData = { commands, menu };

  setTimeout(() => {
    const searchFormObject = searchForm(container, screen, listformData);
    const thisSearchForm = searchFormObject.searchForm;
    const searchFormReturn = searchFormObject.name;

    if (!searchFormReturn.destroyed) {
      searchFormReturn.focus();
      screen.render();
    }

    thisSearchForm.once("submit", (results) => {
      let filteredData = currentData;
      const { name, areaCode, category } = results;
  
      // ⭐ Stars filtering
      if (results.stars !== "") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(([key, value]) => {
            let starsRange = results.stars;
            let starsLower, starsUpper;
            let noRange = true;
  
            if (starsRange.includes("-")) {
              starsLower = parseFloat(starsRange.split("-")[0]);
              starsUpper = parseFloat(starsRange.split("-")[1]);
              noRange = false;
            } else {
              starsRange = parseFloat(starsRange);
            }
  
            const num = parseFloat(value.avg);
  
            return noRange
              ? num === starsRange
              : num >= starsLower && num <= starsUpper;
          })
        );
      }
  
      // Category filter
      if (category !== "None") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) =>
              value.category.toLowerCase() === category.toLowerCase()
          )
        );
      }
  
      // Area code
      if (areaCode !== "") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) => value.areaCode === parseInt(areaCode)
          )
        );
      }
  
      // Name search
      if (name !== "") {
        const lowerName = name.toLowerCase();
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(([key]) =>
            key.toLowerCase().includes(lowerName)
          )
        );
      }
  
      if (Object.keys(filteredData).length === 0) {
        visualError("No results found.", screen, searchFormReturn);
        return;
      }
  
      container.emit("clear");
  
      resultsForm.initiate(filteredData);
      resultsForm.build(container, screen);
  
      commands.Back = { keys: ["esc"] };
      menu.setItems(commands);
  
      // Stable back handler (no recursion leak)
      moveBackHandler = () => {
        delete commands.Back;
        menu.setItems(commands);
        launchSearch(container, screen, commands, menu, currentData);
      };
  
      container.once("re-search", moveBackHandler);
      });

    screen.render();
  }, 500);
}

module.exports = launchSearch;
// Orchestrates the search flow: renders the search form, applies the user's
// filters to the in-memory business data, then transitions to the results
// screen. Also handles navigating back from results to the search form.

const searchForm = require("../screens/searchForm.js");
const resultsForm = require("../screens/results.js");
const visualError = require("../modules/error.js");

// Cached copy of the full business dataset, shared across re-searches
let currentData = {};
// Reference to the current back-navigation handler (kept to allow removal)
let moveBackHandler = null;

function launchSearch(container, screen, commands, menu, logindata) {
  // Remove any leftover key listeners from the previous screen
  screen.removeAllListeners("key tab");
  screen.removeAllListeners("key escape");

  container.emit("clear");

  // Reset menu to default state
  commands.Submit.keys = ["enter"];
  delete commands.Back;

  menu.setItems(commands);

  // Remove any stale re-search listeners to prevent handler leaks
  container.removeAllListeners("re-search");

  // Update cached data only when fresh data is provided
  if (logindata) {
    currentData = logindata;
  }

  const listformData = { commands, menu };

  // Short delay to let the container finish clearing before rendering
  setTimeout(() => {
    const searchFormObject = searchForm(container, screen, listformData);
    const thisSearchForm = searchFormObject.searchForm;
    const searchFormReturn = searchFormObject.name;

    if (!searchFormReturn.destroyed) {
      searchFormReturn.focus();
      screen.render();
    }

    // Wait for the user to submit the search form
    thisSearchForm.once("submit", (results) => {
      let filteredData = currentData;
      const { name, areaCode, category } = results;

      // Filter by star rating — supports exact values and ranges (e.g. "3-5")
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
          }),
        );
      }

      // Filter by category (case-insensitive, skip if "None" selected)
      if (category !== "None") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) =>
              value.category.toLowerCase() === category.toLowerCase(),
          ),
        );
      }

      // Filter by area code (exact numeric match)
      if (areaCode !== "") {
        filteredData = Object.fromEntries(
          Object.entries(filteredData).filter(
            ([, value]) => value.areaCode === parseInt(areaCode),
          ),
        );
      }

      // Filter by business name (case-insensitive substring match)
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

      container.emit("clear");

      // Hand filtered results to the results screen and render it
      resultsForm.initiate(filteredData);
      resultsForm.build(container, screen);

      // Add a Back shortcut so the user can return to search
      commands.Back = { keys: ["esc"] };
      menu.setItems(commands);

      // When "re-search" fires (Escape pressed on results), go back to search
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

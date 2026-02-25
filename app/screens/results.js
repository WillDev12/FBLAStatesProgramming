// Renders the results screen, which shows a scrollable list of businesses on
// the left and a detail/comment panel on the right. Selecting a business from
// the list populates the detail panel. Tab/Shift-Tab cycle focus between
// interactive elements, and Escape navigates back to the search screen.

const commentsHandler = require("../api/comments.js");

// Business data passed in via initiate() before build() is called
let data = {};

// Store the filtered business dataset so build() can access it
function initiate(incomingData) {
  data = incomingData;
}

function build(parent, screen) {
  // Build the left-side results list panel
  const searchBoxObject = require("../modules/searchResults.js")(parent);
  const { searchResults, resultsText, list } = searchBoxObject;

  // Build the right-side description and comments panel
  const descriptionBoxObject = require("../modules/descriptionBox.js")(parent);
  const {
    nameText,
    starsText,
    descriptionBox,
    description,
    commentsContainer,
    backBtn,
    nextBtn,
    commentBtn,
    commentName,
    commentRating,
    commentText,
  } = descriptionBoxObject;

  // Pressing Enter on a list item populates the detail panel with that business
  list.key("enter", () => {
    let business = list.items[list.selected].getContent();
    const delimiter = " - ";

    // Extract the business name from the formatted list item string
    business = business.split(delimiter)[0];

    const businessData = data[business];
    zoomData(business, businessData);
  });

  const commentLabels = { commentName, commentRating, commentText };
  // These elements are hidden when a business has no reviews
  const toHide = [commentName, commentRating, commentText];

  // Wire up the comment navigation and add-comment button
  commentsHandler.initiate(
    screen,
    backBtn,
    nextBtn,
    commentBtn,
    commentLabels,
    nameText,
  );

  // Populates the results list with all businesses and auto-selects the first
  function applyData(data) {
    const businesses = Object.keys(data);
    const num = businesses.length;

    businesses.forEach((business) => {
      const details = data[business];
      const description = details.description.slice(0, 28);

      list.add(
        `${business} - {yellow-fg}${Number(
          details.avg,
        ).toString()}{/} - {gray-fg}${description}...{/gray-fg}`,
      );
    });

    resultsText.content = `Results: {yellow-fg}${Number(num).toString()}{/}`;

    // Show the first business in the detail panel by default
    const firstBusiness = data[businesses[0]];
    zoomData(businesses[0], firstBusiness);

    screen.render();
  }

  // Updates the detail panel to display the given business's info and reviews
  function zoomData(name, data) {
    const { avg, reviews } = data;
    const descriptionText = data.description;

    nameText.content = `Name: {yellow-fg}${name}`;
    starsText.content = `Stars: {yellow-fg}${avg}`;

    description.content = `Description: {gray-fg}${descriptionText}`;

    // Hide comment widgets if there are no reviews, otherwise load them
    if (!reviews.length > 0)
      toHide.forEach((el) => {
        el.hide();
      });
    else {
      toHide.forEach((el) => {
        el.show();
      });
      commentsHandler.loadComments(reviews, commentLabels, screen, name);
    }

    screen.render();
  }

  // Tab order for cycling focus between interactive elements
  const focusOrder = [list, description, backBtn, commentBtn, nextBtn];

  // Move focus to the next element in the tab order
  const toggleFocus = () => {
    let currentIndex = focusOrder.findIndex((el) => el.focused);
    let nextIndex = (currentIndex + 1) % focusOrder.length;

    focusOrder[nextIndex].focus();
    screen.render();
  };

  // Move focus to the previous element in the tab order
  const toggleBack = () => {
    let currentIndex = focusOrder.findIndex((el) => el.focused);
    let prevIndex = (currentIndex - 1 + focusOrder.length) % focusOrder.length;

    focusOrder[prevIndex].focus();
    screen.render();
  };

  // Escape navigates back to the search screen
  const handleBack = () => {
    parent.emit("re-search");
  };

  applyData(data);
  list.focus();

  screen.on("key tab", toggleFocus);
  screen.on("key S-tab", toggleBack);
  screen.on("key escape", handleBack);

  // Clean up screen-level listeners when the list is destroyed to prevent leaks
  list.on("destroy", () => {
    screen.removeListener("key tab", toggleFocus);
    screen.removeListener("key S-tab", toggleBack);
    screen.removeListener("key escape", handleBack);
  });

  screen.render();
}

module.exports = { build, initiate };

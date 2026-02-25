// const blessed = require("neo-blessed");
const commentsHandler = require("../api/comments.js");

// const screen = blessed.screen({
//   smartCSR: true,
//   title: "LocalSearch",
//   ignoreLocked: ["C-q", "C-c"],
// });

let data = {};

function initiate(incomingData) {
  data = incomingData;
}

function build(parent, screen) {
  const searchBoxObject = require("../modules/searchResults.js")(parent);
  const { searchResults, resultsText, list } = searchBoxObject;

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

  list.key("enter", () => {
    let business = list.items[list.selected].getContent();
    const delimiter = " - ";

    business = business.split(delimiter)[0];

    const businessData = data[business];
    zoomData(business, businessData);
  });

  const commentLabels = { commentName, commentRating, commentText };
  const toHide = [commentName, commentRating, commentText];
  // const name = name 
  commentsHandler.initiate(screen, backBtn, nextBtn, commentBtn, commentLabels, nameText);

  //Telecom - {yellow-fg}5{/} - {gray-fg}Basic description of the content that goes about...{/gray-fg}

  function applyData(data) {
    const businesses = Object.keys(data);
    const num = businesses.length;

    businesses.forEach((business) => {
      const details = data[business];
      const description = details.description.slice(0, 28);

      list.add(
        `${business} - {yellow-fg}${Number(
          details.avg
        ).toString()}{/} - {gray-fg}${description}...{/gray-fg}`
      );
    });

    resultsText.content = `Results: {yellow-fg}${Number(num).toString()}{/}`;

    const firstBusiness = data[businesses[0]];
    zoomData(businesses[0], firstBusiness);

    screen.render();
  }

  function zoomData(name, data) {
    const { avg, reviews } = data;
    const descriptionText = data.description;

    nameText.content = `Name: {yellow-fg}${name}`;
    starsText.content = `Stars: {yellow-fg}${avg}`;

    description.content = `Description: {gray-fg}${descriptionText}`;

    if (!reviews.length > 0) toHide.forEach(el => {el.hide()});
    else {
      toHide.forEach(el => {el.show()});
      commentsHandler.loadComments(reviews, commentLabels, screen, name);
    }

    screen.render();
  }

  const focusOrder = [list, description, backBtn, commentBtn, nextBtn];

  const toggleFocus = () => {
    let currentIndex = focusOrder.findIndex((el) => el.focused);
    let nextIndex = (currentIndex + 1) % focusOrder.length;

    focusOrder[nextIndex].focus();
    screen.render();
  };

  const toggleBack = () => {
    let currentIndex = focusOrder.findIndex((el) => el.focused);
    let prevIndex = (currentIndex - 1 + focusOrder.length) % focusOrder.length;

    focusOrder[prevIndex].focus();
    screen.render();
  };

  const handleBack = () => {
    parent.emit("re-search");
  };

  applyData(data);
  list.focus();

  screen.on("key tab", toggleFocus);
  screen.on("key S-tab", toggleBack);
  screen.on("key escape", handleBack);

  list.on("destroy", () => {
    screen.removeListener("key tab", toggleFocus);
    screen.removeListener("key S-tab", toggleBack);
    screen.removeListener("key escape", handleBack);
  });

  // screen.append(menu);
  screen.render();
}

module.exports = { build, initiate };

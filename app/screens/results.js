const commentsHandler = require("../api/comments.js");
const formatName = require("../api/formatName.js");

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

  commentsHandler.initiate(
    screen,
    backBtn,
    nextBtn,
    commentBtn,
    commentLabels,
    nameText,
  );

  const commentRefreshHandler = ({ businessName, businesses }) => {
    commentBtn.setContent(" Add Comment ");
    data = businesses;
    const bizData = businesses[businessName];
    if (!bizData) return;

    const updatedDesc = (bizData.description || "").slice(0, 28);
    const updatedContent = `${businessName} - {yellow-fg}${Number(bizData.avg).toString()}{/} - {gray-fg}${updatedDesc}...{/gray-fg}`;
    for (let i = 0; i < list.items.length; i++) {
      if (list.items[i].getContent().startsWith(businessName + " - ")) {
        list.setItem(i, updatedContent);
        break;
      }
    }

    zoomData(businessName, bizData);
    if (bizData.reviews.length > 0)
      commentsHandler.jumpToComment(bizData.reviews.length - 1, commentLabels, screen);
  };
  parent.on("comment-refresh", commentRefreshHandler);

  function applyData(data) {
    const businesses = Object.keys(data);
    const num = businesses.length;

    businesses.forEach((business) => {
      const details = data[business];
      const description = (details.description || "").slice(0, 28);

      list.add(
        `${business} - {yellow-fg}${Number(
          details.avg,
        ).toString()}{/} - {gray-fg}${description}...{/gray-fg}`,
      );
    });

    resultsText.content = `Results: {yellow-fg}${Number(num).toString()}{/}`;

    const firstBusiness = data[businesses[0]];
    zoomData(businesses[0], firstBusiness);

    screen.render();
  }

  function zoomData(name, data) {
    const { avg, reviews } = data;
    const descriptionText = data.description || "";

    nameText.content = `Name: {yellow-fg}${name}{/} by {yellow-fg}${formatName(data.owner, data.ownerVerified)}{/}`;
    starsText.content = `Stars: {yellow-fg}${avg}`;

    description.content = `Description: {gray-fg}${descriptionText}`;

    commentsHandler.loadComments(reviews, commentLabels, screen, name);
    if (!reviews.length)
      toHide.forEach((el) => {
        el.hide();
      });
    else
      toHide.forEach((el) => {
        el.show();
      });

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
    parent.removeListener("comment-refresh", commentRefreshHandler);
  });

  screen.render();
}

module.exports = { build, initiate };

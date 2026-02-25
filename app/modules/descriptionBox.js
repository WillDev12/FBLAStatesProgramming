// Builds the right-side detail panel shown on the results screen.
// Contains the business name, average star rating, scrollable description,
// and a comments sub-panel with back/next navigation and an "Add Comment" button.

const blessed = require("neo-blessed");
const addComment = require("./comment.js");

function build(parent) {
  // Outer container for the entire detail panel
  const descriptionBox = blessed.box({
    parent: parent,
    top: "center",
    right: 0,

    width: "55%",
    height: 18,
    border: "line",

    padding: {
      right: 2,
      left: 2,
      top: 1,
      bottom: 1,
    },
    label: " Description ",

    style: {
      border: {
        fg: "blue",
      },
    },
  });

  // Business name (top-left of the panel)
  const nameText = blessed.text({
    top: 0,
    parent: descriptionBox,

    tags: true,
    content: `Name: {yellow-fg}Hello world{/}`,
  });

  // Average star rating (top-right of the panel)
  const starsText = blessed.text({
    top: 0,
    right: 0,
    parent: descriptionBox,

    tags: true,
    content: `Stars: {yellow-fg}5{/}`,
  });

  // Scrollable description text area
  const description = blessed.text({
    top: 2,
    left: 0,
    right: 0,
    parent: descriptionBox,

    scrollable: true,
    alwaysScroll: true,

    keys: true,
    vi: true,
    tags: true,

    style: {
      focus: {
        bg: 244,
      },
    },

    scrollbar: {
      ch: " ",
      track: { bg: 235 },
      style: {
        inverse: true,
        bg: 244,
      },
    },

    height: 4,
    content: `Description: {gray-fg}`,
  });

  // Sub-panel that holds the comments section
  const commentsContainer = blessed.box({
    parent: descriptionBox,
    top: 7,
    left: 0,
    right: 0,
    height: 8,
  });

  blessed.text({
    parent: commentsContainer,
    top: 0,
    left: 0,

    content: "Comments:",
  });

  // Individual comment display widget (name, rating, body)
  const commentObject = addComment(commentsContainer);
  const { commentName, commentRating, commentText } = commentObject;

  // Navigate to the previous comment
  const backBtn = blessed.button({
    parent: commentsContainer,
    top: 6,
    left: 0,
    width: 5,
    content: " <-- ",
    height: 1,

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  // Navigate to the next comment
  const nextBtn = blessed.button({
    parent: commentsContainer,
    top: 6,
    right: 0,
    width: 5,
    height: 1,
    content: " --> ",

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  // Open the add-comment form overlay
  const commentBtn = blessed.button({
    parent: commentsContainer,
    top: 6,
    left: "center",
    width: 13,
    height: 1,

    content: " Add Comment ",

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  return {
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
  };
}

module.exports = build;

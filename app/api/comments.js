// Manages comment navigation and submission on the results screen.
// Keeps track of which business is active and which comment index is showing,
// and wires up the back/next/add-comment buttons.

const addCommentForm = require("../modules/addComment");

// Index of the currently displayed comment
let commentIndex = 0;
// Full list of reviews for the active business
let activeComments = [];
// Name of the business whose comments are being viewed
let activeBusiness;

// Sets the active comment list and renders the first comment
function loadComments(comments, commentLabels, screen, name) {
  activeComments = comments;
  activeBusiness = name;
  loadComment(0, commentLabels, screen);
}

// Renders a single comment at the given index into the label widgets
function loadComment(index, commentLabels, screen) {
  const { user, stars, comment } = activeComments[index];
  const { commentName, commentRating, commentText } = commentLabels;
  commentName.content = `User: {yellow-fg}${user}`;
  commentRating.content = `Rating: {yellow-fg}${stars}`;
  commentText.content = `{gray-fg}${comment}`;
  screen.render();
}

// Attaches event listeners to the navigation and comment buttons
function initiate(
  screen,
  backBtn,
  nextBtn,
  commentBtn,
  commentLabels,
  businessName,
) {
  // Open the add-comment form overlay when the button is pressed
  commentBtn.on("press", () => {
    const commentForm = addCommentForm(screen);
    screen.append(commentForm);

    screen.render();

    // Cancel closes the form without saving
    commentForm.on("cancel", () => {
      setImmediate(() => {
        commentForm.destroy();
        screen.render();
      });
    });

    // On submit, strip blessed colour tags from the business name, then
    // bubble the comment data up to the root container
    commentForm.on("submit", (formData) => {
      setImmediate(() => {
        activeBusiness = businessName.content.split(": ")[1];
        activeBusiness = activeBusiness
          .replace("{yellow-fg}", "")
          .replace("{/}", "");
        handleComment(formData, screen);
        commentForm.destroy();
        screen.render();
      });
    });
  });

  // Back and Next buttons step through the active comment list
  [backBtn, nextBtn].forEach((el) => {
    el.on("press", () => {
      const nextIndex = el === backBtn ? commentIndex - 1 : commentIndex + 1;
      if (nextIndex < 0 || nextIndex >= activeComments.length) return;
      else {
        commentIndex = nextIndex;
        loadComment(commentIndex, commentLabels, screen);
      }
    });
  });
}

// Attaches the active business name to the form data and emits a "comment"
// event on the root container so app.js can POST it to the server
function handleComment(formData, screen) {
  const container = screen.children[0];
  formData.businessName = activeBusiness;
  container.emit("comment", formData);
}

module.exports = { loadComments, initiate };

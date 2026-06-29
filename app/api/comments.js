const addCommentForm = require("../modules/addComment");
const formatName = require("./formatName.js");

let commentIndex = 0;
let activeComments = [];
let activeBusiness;

function loadComments(comments, commentLabels, screen, name) {
  activeComments = comments;
  activeBusiness = name;
  if (comments.length > 0) loadComment(0, commentLabels, screen);
}

// Renders a single comment at the given index into the label widgets
function loadComment(index, commentLabels, screen) {
  const { user, userVerified, stars, comment } = activeComments[index];
  const { commentName, commentRating, commentText } = commentLabels;
  commentName.content = `User: {yellow-fg}${formatName(user, userVerified)}`;
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
        handleComment(formData, screen);
        commentForm.destroy();
        commentBtn.setContent(" Commenting... ");
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

// Jumps directly to a specific comment index (used after a new comment is posted)
function jumpToComment(index, commentLabels, screen) {
  commentIndex = index;
  loadComment(commentIndex, commentLabels, screen);
}

module.exports = { loadComments, initiate, jumpToComment };

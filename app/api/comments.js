const addCommentForm = require("../modules/addComment");

let commentIndex = 0;
let activeComments = [];

function loadComments(comments, commentLabels, screen) {
  activeComments = comments;
  loadComment(0, commentLabels, screen);
}

// use normal comment object
function loadComment(index, commentLabels, screen) {
  const { user, stars, comment } = activeComments[index];
  const { commentName, commentRating, commentText } = commentLabels;
  commentName.content = `User: {yellow-fg}${user}`;
  commentRating.content = `Rating: {yellow-fg}${stars}`;
  commentText.content = `{gray-fg}${comment}`;
  screen.render();
}

function initiate(screen, backBtn, nextBtn, commentBtn, commentLabels) {
  commentBtn.on("press", () => {
    const commentForm = addCommentForm(screen);
    screen.append(commentForm);

    screen.render();

    commentForm.on("cancel", () => {
      setImmediate(() => {
        commentForm.destroy();
        screen.render();
      });
    });

    commentForm.on("submit", (formData) => {
      setImmediate(() => {
        handleComment(formData, screen);
        commentForm.destroy();
        screen.render();
      });
    });
  });

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

function handleComment(formData, screen) {
  const container = screen.children[0];
  container.emit("comment", formData);
}

module.exports = { loadComments, initiate };

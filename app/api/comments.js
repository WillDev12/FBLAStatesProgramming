const addCommentForm = require("../modules/addComment");

let commentIndex = 0;
let activeComments = [];
let activeBusiness;

function loadComments(comments, commentLabels, screen, name) {
  activeComments = comments;
  activeBusiness = name;
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

function initiate(screen, backBtn, nextBtn, commentBtn, commentLabels, businessName) {
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
        activeBusiness = businessName.content.split(": ")[1];
        activeBusiness = activeBusiness.replace("{yellow-fg}", "")
        .replace("{/}", "");
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
  formData.businessName = activeBusiness;
  container.emit("comment", formData);
}

module.exports = { loadComments, initiate };

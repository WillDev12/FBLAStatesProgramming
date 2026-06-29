const blessed = require("neo-blessed");

function build(screen) {
  const addCommentBox = blessed.form({
    parent: screen,
    top: "center",
    left: "center",
    label: " Add Comment ",

    keys: true,
    vi: true,

    padding: {
      top: 1,
      bottom: 1,
      left: 2,
      right: 2,
    },
    border: "line",
    style: {
      border: {
        fg: "blue",
      },
    },

    width: 60,
    height: 12,
  });

  const commentBox = blessed.textbox({
    parent: addCommentBox,
    top: 0,
    left: 0,
    name: "comment",

    border: "line",
    height: 3,
    label: " Comment ",

    inputOnFocus: true,
  });

  const starsBox = blessed.textbox({
    parent: addCommentBox,
    top: 3,
    left: 0,
    name: "stars",

    border: "line",
    label: " Stars ",
    height: 3,
    width: 12,

    inputOnFocus: true,
  });

  blessed.text({
    parent: addCommentBox,
    tags: true,
    top: 4,
    left: 14,

    content: `{gray-fg}No decimals, select numbers 0-5.`,
  });

  const cancelBtn = blessed.button({
    parent: addCommentBox,
    top: 7,
    left: 0,

    content: " Cancel ",
    height: 1,
    width: 8,

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  const submitBtn = blessed.button({
    parent: addCommentBox,
    top: 7,
    right: 0,

    content: " Submit ",
    height: 1,
    width: 8,

    style: {
      bg: "blue",
      focus: {
        bg: "red",
      },
    },
  });

  blessed.text({
    parent: addCommentBox,
    top: 7,
    left: "center",
    tags: true,

    content: "{gray-fg}Any comments are permanent.",
  });

  // Validates a textbox on each keypress; turns the border red if invalid
  const validate = (source) => {
    setImmediate(() => {
      const val = source.getValue().trim();

      const starsRegex = /^[0-5]$/;
      const commentRegex = /^[\s\S]{1,171}$/;

      const validPattern = source === starsBox ? starsRegex : commentRegex;

      if (val === "") {
        source.style.border.fg = "white";
      } else if (!validPattern.test(val)) {
        source.style.border.fg = "red";
      } else {
        source.style.border.fg = "white";
      }

      screen.render();
    });
  };

  commentBox.focus();

  let submitting = false;

  cancelBtn.on("press", () => { if (!submitting) addCommentBox.emit("cancel"); });

  // Only submit if both fields are valid and non-empty
  submitBtn.on("press", () => {
    if (submitting) return;

    const isCommentInvalid = commentBox.style.border.fg === "red";
    const isStarsInvalid = starsBox.style.border.fg === "red";

    const isCommentEmpty = commentBox.getValue().trim() === "";
    const isStarsEmpty = starsBox.getValue().trim() === "";

    if (isCommentInvalid || isStarsInvalid || isCommentEmpty || isStarsEmpty) {
      // Highlight empty fields as invalid
      if (isCommentEmpty) commentBox.style.border.fg = "red";
      if (isStarsEmpty) starsBox.style.border.fg = "red";

      addCommentBox.screen.render();
      return;
    }

    submitting = true;
    addCommentBox.submit();
  });

  // Enter advances focus: comment → stars → submit
  commentBox.on("submit", () => { starsBox.focus(); });
  starsBox.on("submit", () => { submitBtn.press(); });

  // Attach live validation to both input fields
  [commentBox, starsBox].forEach((el) => {
    el.on("keypress", () => validate(el));
  });

  return addCommentBox;
}

module.exports = build;

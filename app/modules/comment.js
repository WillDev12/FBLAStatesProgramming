const blessed = require("neo-blessed");

function build(parentBox) {
  const comment = blessed.box({
    parent: parentBox,
    top: 1,
    height: 4,
    // padding: { top: 1 },
    width: "100%",
    interactive: false,
  });

  const commentName = blessed.text({
    parent: comment,
    interactive: false,
    top: 0,
    left: 0,
    tags: true,

    content: `User: {gray-fg}`,
  });

  const commentRating = blessed.text({
    parent: comment,
    interactive: false,
    top: 0,
    right: 0,
    tags: true,

    content: `Rating: {yellow-fg}`,
  });

  const commentText = blessed.text({
    parent: comment,
    interactive: false,
    top: 1,
    height: 3,
    tags: true,

    content: `{gray-fg}{/}`,
  });

  return { commentName, commentRating, commentText };
}

module.exports = build;

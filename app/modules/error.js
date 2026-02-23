const blessed = require("neo-blessed");

function errorScreen(msg, parent, focus) {
  const box = blessed.box({
    width: 52,
    height: "shrink",
    top: "center",
    left: "center",
    label: " Error! ",
    border: "line",
    style: { border: { fg: "red" } },
    parent: parent,
    padding: 1,
  });

  blessed.text({
    parent: box,
    top: 0,
    left: 2,
    width: 30,
    content: msg,
  });

  const exitBtn = blessed.button({
    parent: box,
    right: 2,
    shrink: true,
    content: " Okay ",
    padding: { left: 1, right: 1 },
    style: { bg: "blue", focus: { bg: "red" }, hover: { bg: "red" } },
  });

  exitBtn.focus();

  exitBtn.on("press", () => {
    box.destroy();
    setImmediate(() => {
      if (focus && !focus.destroyed) {
        focus.focus();
        parent.render(); // Use parent or screen.render()
      }
    });
  });

  return { box };
}

module.exports = errorScreen;

const blessed = require("neo-blessed");

const domain = "localhost:3000";

function valPrompt(code, parent, type) {
  const box = blessed.box({
    width: 70,
    height: "shrink",
    top: "center",
    left: "center",
    label: " Verification ",
    border: "line",
    style: { border: { fg: "blue" } },
    parent: parent,
    padding: 1,
  });

  blessed.text({
    parent: box,
    top: 0,
    left: 2,
    width: 50,
    content: `Please open the following url in a web browser:\nhttps://${domain}/${type}/verify/${code}\n\nAnd click the button`,
  });

  const exitBtn = blessed.button({
    parent: box,
    right: 2,
    shrink: true,
    content: " Verify ",
    padding: { left: 1, right: 1 },
    style: { bg: "blue", focus: { bg: "red" }, hover: { bg: "red" } },
  });

  exitBtn.focus();
  // parent.screen.render();

  exitBtn.on("press", () => {
    box.emit("login_attempt", code);
  });

  return { box, exitBtn };
}

module.exports = valPrompt;

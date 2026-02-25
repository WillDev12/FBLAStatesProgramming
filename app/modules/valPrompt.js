// Displays the verification prompt that appears after login or signup.
// Instructs the user to visit a URL to confirm their identity, then emits
// a "login_attempt" event when they press the Verify button so the calling
// code can POST the code to the server and complete the flow.

const blessed = require("neo-blessed");

const domain = "localhost:3000";

// Builds and returns the verification dialog box.
// type is either "login" or "signup", which determines the URL path shown.
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

  // Instruction text with the verification URL for the user to open
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

  // Emit "login_attempt" with the code so loginHandler can verify it with the server
  exitBtn.on("press", () => {
    box.emit("login_attempt", code);
  });

  return { box, exitBtn };
}

module.exports = valPrompt;

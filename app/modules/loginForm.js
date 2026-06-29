const blessed = require("neo-blessed");
const visualError = require("./error");

function createForm(parent, text, login) {

  const form = blessed.form({
    parent: parent,
    width: 50,
    height: 10,
    top: "center",
    left: "center",
    keys: true,
    border: "line",
    label: ` ${text} `,
    style: { border: { fg: "blue" } },
  });

  blessed.text({ parent: form, top: 2, left: 2, content: "Username:" });
  const username = blessed.textbox({
    parent: form,
    name: "user",
    top: 2,
    left: 12,
    width: 30,
    height: 1,
    inputOnFocus: true,
  });

  blessed.text({ parent: form, top: 4, left: 2, content: "Password:" });
  const password = blessed.textbox({
    parent: form,
    name: "pass",
    censor: true,
    top: 4,
    left: 12,
    width: 30,
    height: 1,
    inputOnFocus: true,
  });

  const submitBtn = blessed.button({
    parent: form,
    name: "submit",
    content: ` ${text.toUpperCase()} `,
    top: 6,
    left: login ? "25%" : "center",
    shrink: true,
    padding: { left: 1, right: 1 },
    style: {
      bg: "blue",
      focus: { bg: "red" },
      hover: { bg: "red" },
    },
  });

  submitBtn.on("press", () => {
    if (username.value.trim().length > 0 && password.value.trim().length > 0)
      form.submit();
    else visualError("You need to fill in every value.", parent, submitBtn);
  });

  username.on("submit", () => { password.focus(); });
  password.on("submit", () => { submitBtn.press(); });

  // setImmediate ensures focus lands after the screen renders, so it reaches
  // the textbox itself rather than the form container
  setImmediate(() => { if (!form.destroyed) username.focus(); });

  if (login) {
    const signupBtn = blessed.button({
      parent: form,
      name: "signup",
      content: " SIGN UP ",
      top: 6,
      left: "50%",
      shrink: true,
      padding: { left: 1, right: 1 },
      mouse: true,
      style: {
        bg: "blue",
        focus: { bg: "red" },
        hover: { bg: "red" },
      },
    });

    signupBtn.on("press", () => form.emit("signup_transition"));
  }

  return { form, submitBtn };
}

module.exports = { createForm };

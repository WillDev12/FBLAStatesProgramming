// Reusable form builder for the login and signup screens.
// When login=true, a "Sign Up" button is also rendered so the user can switch
// flows without clearing the screen.

const blessed = require("neo-blessed");
const visualError = require("./error");

// Builds a username/password form with a submit button and optional signup button.
// Returns { form, submitBtn } so the caller can attach its own submit handler.
function createForm(parent, text, login) {

  const form = blessed.form({
    parent: parent,
    width: 50,
    height: 10,
    top: "center",
    left: "center",
    keys: true,
    vi: true,
    border: "line",
    label: ` ${text} `,
    style: { border: { fg: "blue" } },
  });

  // Username input
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

  // Password input (characters are censored/masked)
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

  // Submit button — positioned to the left when login=true to make room for
  // the Sign Up button, otherwise centred
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

  // Require both fields to be filled before submitting
  submitBtn.on("press", () => {
    if (username.value.trim().length > 0 && password.value.trim().length > 0)
      form.submit();
    else visualError("You need to fill in every value.", parent, submitBtn);
  });

  username.focus();

  // Only the login form includes a "Sign Up" button
  if (login) {
    const signupBtn = blessed.button({
      parent: form,
      name: "signup",
      content: " SIGN UP ",
      top: 6,
      left: "50%",
      shrink: true,
      padding: { left: 1, right: 1 },
      style: {
        bg: "blue",
        focus: { bg: "red" },
        hover: { bg: "red" },
      },
    });

    // Bubble the transition event up so loginHandler can swap the screen
    signupBtn.on("press", () => form.emit("signup_transition"));
  }

  return { form, submitBtn };
}

module.exports = { createForm };

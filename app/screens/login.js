// Renders the login and signup screens by delegating to the shared loginForm
// module, then emits the appropriate container events when the user submits
// or switches between the two forms.

const { createForm } = require("../modules/loginForm.js");

// Renders the Log In form and emits events for submission and form switching
function login(parent) {
  const thisForm = createForm(parent, "Log In", true);

  thisForm.form.on("submit", (data) => {
    // Include the submit button so the error screen can restore focus on failure
    parent.emit("login_attempt", { ...data, button: thisForm.submitBtn });
  });

  thisForm.form.on("signup_transition", () => {
    parent.emit("signup_transition", thisForm.form);
  });
}

// Renders the Sign Up form. Pressing Escape returns to the login screen.
function signup(parent, callback) {
  const thisForm = createForm(parent, "Sign Up");

  thisForm.form.key(["escape"], () => {
    parent.emit("login_transition", thisForm.form);
  });

  thisForm.form.on("submit", (data) => {
    // Bundle form data, button reference, and callback flag into one payload
    const payload = {
      data,
      button: thisForm.submitBtn,
      callback: !!callback,
    };
    parent.emit("signup_attempt", payload);
  });
}

module.exports = { login, signup };

const { createForm } = require("../modules/loginForm.js");

function login(parent) {
  const thisForm = createForm(parent, "Log In", true);

  thisForm.form.on("submit", (data) => {
    // Pass button reference for focus management
    parent.emit("login_attempt", { ...data, button: thisForm.submitBtn });
  });

  thisForm.form.on("signup_transition", () => {
    parent.emit("signup_transition", thisForm.form);
  });
}

function signup(parent, callback) {
  const thisForm = createForm(parent, "Sign Up");

  thisForm.form.key(["escape"], () => {
    parent.emit("login_transition", thisForm.form);
  });

  thisForm.form.on("submit", (data) => {
    // Package button reference so errorScreen can restore focus
    const payload = {
      data,
      button: thisForm.submitBtn,
      callback: !!callback,
    };
    parent.emit("signup_attempt", payload);
  });
}

module.exports = { login, signup };

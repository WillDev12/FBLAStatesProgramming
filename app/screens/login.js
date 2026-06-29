const { createForm } = require("../modules/loginForm.js");

function login(parent) {
  const thisForm = createForm(parent, "Log In", true);

  thisForm.form.on("submit", (data) => {
    parent.emit("login_attempt", { ...data, button: thisForm.submitBtn });
  });

  thisForm.form.on("signup_transition", () => {
    parent.emit("signup_transition", thisForm.form);
  });
}

function signup(parent, callback) {
  const thisForm = createForm(parent, "Sign Up");

  let gone = false;
  const goBack = () => {
    if (gone) return;
    gone = true;
    parent.emit("login_transition", thisForm.form);
  };

  // Screen-level handler catches escape while a textbox has grabbed keys
  // (escape is in ignoreLocked so it fires through the grab)
  const screen = parent.screen;
  screen.key(["escape"], goBack);
  thisForm.form.on("destroy", () => screen.unkey(["escape"], goBack));

  thisForm.form.on("submit", (data) => {
    const payload = {
      data,
      button: thisForm.submitBtn,
      callback: !!callback,
    };
    parent.emit("signup_attempt", payload);
  });
}

module.exports = { login, signup };

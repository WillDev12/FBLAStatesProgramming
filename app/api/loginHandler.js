const errorScreen = require("../modules/error.js");
const loginForm = require("../screens/login.js");
const valPrompt = require("../modules/valPrompt.js");
const api = require("./requestAPI.js");

function loginHandler(screen, container, commands, menu) {

  // Switch from the login form to the signup form
  container.on("signup_transition", (thisForm) => {
    thisForm.destroy();
    commands.Back = { keys: ["esc"] };
    menu.setItems(commands);
    loginForm.signup(container, true);
    screen.render();
  });

  // Switch from the signup form back to the login form
  container.on("login_transition", (thisForm) => {
    thisForm.destroy();
    delete commands.Back;
    menu.setItems(commands);
    loginForm.login(container);
    screen.render();
  });

  // Handle a login form submission
  container.on("login_attempt", async (data) => {
    const { button, user, pass } = data;

    try {
      const response = await api.post("/user/login", {
        username: user,
        password: pass,
      });

      const auth = response.data || {};

      if (response.statusCode >= 400 || auth.error) {
        const message = typeof auth === "string" ? auth : auth.error;
        errorScreen(message || "Login failed", container, button);
        return;
      }

      // Credentials accepted — show the verification prompt
      const prompt = verify(auth, screen, button);
      prompt.on("verification", (finalData) => {
        container.emit("login", { ...finalData, name: user });
      });
    } catch (e) {
      errorScreen("Internal server error. Try again later.", container, button);
    }
  });

  // Handle a signup form submission
  container.on("signup_attempt", async (payload) => {
    const { data, button } = payload;

    try {
      const response = await api.post("/user/signup", {
        username: data.user,
        password: data.pass,
      });

      const auth = response.data || {};

      if (response.statusCode >= 400 || auth.error) {
        errorScreen(auth.error || "Signup failed", container, button);
        return;
      }

      // Registration accepted — show the verification prompt
      const prompt = verifySignup(auth, screen, button);
      prompt.on("verification", (userData) => {
        container.emit("signup", { ...userData, name: data.user });
      });
    } catch (e) {
      errorScreen("Server error during signup.", container, button);
    }
  });
}

// Shows the verification prompt for signup and POSTs the code to the server.
// Emits "verification" on the prompt when the server confirms the code.
function verifySignup(auth, container, button) {
  const { code } = auth;
  const promptObjet = valPrompt(code, container, "signup");
  const prompt = promptObjet.box;
  const promptBtn = promptObjet.exitBtn;

  prompt.on("login_attempt", async (valCode) => {
    try {
      const response = await api.post("/user/signup/verify", { code: valCode });
      const result = response.data || {};

      if (response.statusCode >= 400 || result.error) {
        prompt.emit("verify_failed");
        errorScreen(
          result.error || "Verification failed",
          container,
          promptBtn,
        );
        return;
      }

      prompt.emit("verification", result);
      prompt.destroy();
    } catch (e) {
      prompt.emit("verify_failed");
      errorScreen("Internal server error.", container, button);
    }
  });

  return prompt;
}

// Shows the verification prompt for login and POSTs the code to the server.
// Emits "verification" on the prompt when the server confirms the code.
function verify(auth, container, button) {
  const { code } = auth;
  const verificationObject = valPrompt(code, container, "login");
  const prompt = verificationObject.box;
  const promptBtn = verificationObject.exitBtn;

  promptBtn.focus();

  prompt.on("login_attempt", async (valCode) => {
    try {
      const response = await api.post("/user/login/verify", { code: valCode });
      const result = response.data || {};

      if (response.statusCode >= 400 || result.error) {
        prompt.emit("verify_failed");
        errorScreen(
          result.error || "Verification failed",
          container,
          promptBtn,
        );
        return;
      }

      prompt.emit("verification", result);
      prompt.destroy();
    } catch (e) {
      prompt.emit("verify_failed");
      errorScreen("Internal server error.", container, promptBtn);
    }
  });

  return prompt;
}

module.exports = loginHandler;

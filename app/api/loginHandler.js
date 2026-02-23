const errorScreen = require("../modules/error.js");
const loginForm = require("../screens/login.js");
const valPrompt = require("../modules/valPrompt.js");
const api = require("./requestAPI.js");

function loginHandler(screen, container) {
  // Transition from Login to Signup screen
  container.on("signup_transition", (thisForm) => {
    thisForm.destroy();
    loginForm.signup(container, true);
    screen.render();
  });

  // Handle Login Attempts
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

      // Show verification prompt for Login
      const prompt = verify(auth, screen, button);
      prompt.on("verification", (finalData) => {
        container.emit("login", finalData);
        // screen.destroy();
        // console.log("Login Successful:", finalData);
      });
    } catch (e) {
      errorScreen("Internal server error. Try again later.", container, button);
    }
  });

  // Handle Signup Attempts
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

      // Show verification prompt for Signup
      const prompt = verifySignup(auth, screen, button);
      prompt.on("verification", (userData) => {
        container.emit("signup", userData);
        // screen.destroy();
        // console.log("Account Created:", userData);
      });
    } catch (e) {
      errorScreen("Server error during signup.", container, button);
    }
  });
}

// Helper: Verification for Signup
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
        errorScreen(
          result.error || "Verification failed",
          container,
          promptBtn
        );
        return;
      }

      prompt.destroy();
      prompt.emit("verification", result);
    } catch (e) {
      errorScreen("Internal server error.", container, button);
    }
  });

  return prompt;
}

// Helper: Verification for Login
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
        errorScreen(
          result.error || "Verification failed",
          container,
          promptBtn
        );
        return;
      }

      prompt.destroy();
      prompt.emit("verification", result);
    } catch (e) {
      errorScreen("Internal server error.", container, promptBtn);
    }
  });

  return prompt;
}

module.exports = loginHandler;

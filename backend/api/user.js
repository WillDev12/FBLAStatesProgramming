// Handles all user authentication routes: login, signup, and their two-step
// verification flows. Each flow generates a 6-digit code that must be
// confirmed via a separate GET request before the session UUID is issued.

const express = require("express");
const router = express.Router();
const ss = require("@willdevv12/simplestore");
const crypto = require("crypto");

// Load persisted user data from disk
const userData = ss.loadData("./data", "userData");

// Holds pending login codes waiting to be verified
const activeIDs = [];
// Holds pending signup registrations waiting to be verified
const pendingSignups = [];

// POST /login — Validates credentials and issues a one-time verification code
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!userData[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (userData[username].password === password) {
    returnCode(res, username);
  } else {
    res.status(401).json({ error: "Password incorrect" });
  }
});

// GET /login/verify/:id — Marks a login code as verified (simulates clicking a link)
router.get("/login/verify/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = activeIDs.find((u) => u.code === id);

  if (!user) return res.status(404).json({ error: "ID not found" });
  if (Date.now() > user.expires) {
    // Remove expired codes
    activeIDs.splice(activeIDs.indexOf(user), 1);
    return res.status(401).json({ error: "Code expired" });
  }

  user.verified = true;
  res.json({ message: "Code marked as verified" });
});

// POST /login/verify — Exchanges a verified code for the user's session UUID
router.post("/login/verify", (req, res) => {
  const { code } = req.body;
  const index = activeIDs.findIndex((u) => u.code === Number(code));

  if (index !== -1 && activeIDs[index].verified) {
    const resultUUID = userData[activeIDs[index].account].uuid;
    activeIDs.splice(index, 1); // Clean up after successful retrieval
    return res.json({ uuid: resultUUID });
  }
  res.status(400).json({ error: "Code not verified or not found" });
});

// POST /signup — Registers a new user and issues a verification code
router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (userData[username]) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const signupCode = crypto.randomInt(100000, 999999);
  const newUserUUID = crypto.randomUUID();

  // Stage the new user until their code is verified
  pendingSignups.push({
    username,
    password,
    uuid: newUserUUID,
    code: signupCode,
    expires: Date.now() + 10 * 60 * 1000, // Code expires in 10 minutes
  });

  res.json({ code: signupCode });
});

// GET /signup/verify/:id — Marks a signup code as verified
router.get("/signup/verify/:id", (req, res) => {
  const code = Number(req.params.id);
  const user = pendingSignups.find((u) => u.code === code);

  if (!user) return res.status(404).json({ error: "Invalid code" });
  if (Date.now() > user.expires) {
    pendingSignups.splice(pendingSignups.indexOf(user), 1);
    return res.status(401).json({ error: "Signup code expired" });
  }

  user.verified = true;
  res.json({ message: "Signup marked as verified" });
});

// POST /signup/verify — Finalises account creation and returns the new user's UUID
router.post("/signup/verify", (req, res) => {
  const { code } = req.body;
  const index = pendingSignups.findIndex((u) => u.code === Number(code));

  if (index !== -1 && pendingSignups[index].verified) {
    const newUser = pendingSignups[index];

    // Commit the new user to the data store
    userData[newUser.username] = {
      password: newUser.password,
      uuid: newUser.uuid,
    };
    ss.updateData("./data", "userData", userData);

    pendingSignups.splice(index, 1);
    return res.json({ uuid: newUser.uuid });
  }
  res.status(400).json({ error: "Code not verified or not found" });
});

// Generates a unique 6-digit login code, stores it with a 5-minute expiry,
// and sends it back to the client
function returnCode(res, username) {
  const uniqueCode = crypto.randomInt(100000, 999999);
  const expiryTime = Date.now() + 5 * 60 * 1000;

  activeIDs.push({
    code: uniqueCode,
    account: username,
    expires: expiryTime,
    verified: false,
  });

  res.json({ code: uniqueCode });
}

module.exports = router;

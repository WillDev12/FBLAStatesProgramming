// Import necessary libraries

const express = require("express");
const router = express.Router();
const ss = require("@willdevv12/simplestore"); // https://github.com/WillDev12/simpleSave
const crypto = require("crypto");

// Structure data

const userData = ss.loadData("./data", "userData");

const activeIDs = [];
const pendingSignups = [];

// Handle webhooks

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

// --- LOGIN VERIFICATION ---

// 1. GET: Mark as verified
router.get("/login/verify/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = activeIDs.find((u) => u.code === id);

  if (!user) return res.status(404).json({ error: "ID not found" });
  if (Date.now() > user.expires) {
    activeIDs.splice(activeIDs.indexOf(user), 1);
    return res.status(401).json({ error: "Code expired" });
  }

  user.verified = true;
  res.json({ message: "Code marked as verified" });
});

// 2. POST: Retrieve UUID and cleanup
router.post("/login/verify", (req, res) => {
  const { code } = req.body;
  const index = activeIDs.findIndex((u) => u.code === Number(code));

  if (index !== -1 && activeIDs[index].verified) {
    const resultUUID = userData[activeIDs[index].account].uuid;
    activeIDs.splice(index, 1); // Remove after retrieval
    return res.json({ uuid: resultUUID });
  }
  res.status(400).json({ error: "Code not verified or not found" });
});

router.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (userData[username]) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const signupCode = crypto.randomInt(100000, 999999);
  const newUserUUID = crypto.randomUUID();

  pendingSignups.push({
    username,
    password,
    uuid: newUserUUID,
    code: signupCode,
    expires: Date.now() + 10 * 60 * 1000,
  });

  res.json({ code: signupCode });
});

// --- SIGNUP VERIFICATION ---

// 1. GET: Mark as verified
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

// 2. POST: Create user and retrieve UUID
router.post("/signup/verify", (req, res) => {
  const { code } = req.body;
  const index = pendingSignups.findIndex((u) => u.code === Number(code));

  if (index !== -1 && pendingSignups[index].verified) {
    const newUser = pendingSignups[index];

    // Commit to database
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

// Complimentary function (generates unique verification codes)

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

// Exportation of router for implimentation into the root

module.exports = router;

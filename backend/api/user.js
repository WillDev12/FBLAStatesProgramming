require("dotenv").config();

const express = require("express");
const router = express.Router();
const ss = require("@willdevv12/simplestore");
const crypto = require("crypto");

const htmlOutput = require("../html/loadHtml.js");
const responsePairs = {
  badRequest: {
    text: "Bad Request!",
    body: "Something went wrong -- you aren't supposed to be here!"
  },
  verification: {
    text: "Success!",
    body: "Your code has been marked as verified. You may now close this page."
  }
};

const userData = ss.loadData("./data", "userData");
const { businessData } = require("./data");

const activeIDs = [];
const pendingSignups = [];

router.get("/", (req, res) => {
  try {
    const { key } = req.body;
  
    if (key === process.env.adminKey) return res.json(userData);
    else throw new Error;
  } catch (e) {
    return res.status(401).send(htmlOutput(responsePairs.badRequest));
  }
});

router.patch("/:username/verify", (req, res) => {
  const { key } = req.body;
  if (key !== process.env.adminKey) return res.status(401).end();

  const { username } = req.params;
  if (!userData[username]) return res.status(404).json({ error: "User not found" });

  userData[username].verified = !userData[username].verified;
  ss.updateData("./data", "userData", userData);

  res.json({ verified: userData[username].verified });
});

router.delete("/:username", (req, res) => {
  const { key } = req.body;

  if (key !== process.env.adminKey) return res.status(401).end();

  const { username } = req.params;
  if (!userData[username]) return res.status(404).send({ error: "User not found" });

  for (const bizName of Object.keys(businessData)) {
    if (businessData[bizName].owner === username) {
      delete businessData[bizName];
    }
  }

  for (const biz of Object.values(businessData)) {
    const before = biz.reviews.length;
    biz.reviews = biz.reviews.filter(r => r.user !== username);
    if (biz.reviews.length !== before) {
      biz.avg = biz.reviews.length === 0
        ? 0
        : (biz.reviews.reduce((sum, r) => sum + r.stars, 0) / biz.reviews.length).toFixed(1);
    }
  }

  ss.updateData("./data", "content", businessData);

  delete userData[username];
  ss.updateData("./data", "userData", userData);

  res.json({ message: "User deleted" });
});

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

router.get("/login/verify/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = activeIDs.find((u) => u.code === id);

  if (!user) return res.status(404).send(htmlOutput({ text: "Internal Server Error", body: "ID not found" }));
  if (Date.now() > user.expires) {
    activeIDs.splice(activeIDs.indexOf(user), 1);
    return res.status(401).send(htmlOutput(responsePairs.badRequest));
  }

  user.verified = true;
  res.send(htmlOutput(responsePairs.verification));
});

router.post("/login/verify", (req, res) => {
  const { code } = req.body;
  const index = activeIDs.findIndex((u) => u.code === Number(code));

  if (index !== -1 && activeIDs[index].verified) {
    const account = userData[activeIDs[index].account];
    activeIDs.splice(index, 1); // Clean up after successful retrieval
    return res.json({ uuid: account.uuid, verified: !!account.verified });
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
    expires: Date.now() + 10 * 60 * 1000, // Code expires in 10 minutes
  });

  res.json({ code: signupCode });
});

router.get("/signup/verify/:id", (req, res) => {
  const code = Number(req.params.id);
  const user = pendingSignups.find((u) => u.code === code);

  if (!user) return res.status(404).send(htmlOutput({ text: "Internal Server Error", body: "ID not found" }));
  if (Date.now() > user.expires) {
    pendingSignups.splice(pendingSignups.indexOf(user), 1);
    return res.status(401).send(htmlOutput(responsePairs.badRequest));
  }

  user.verified = true;
  res.send(htmlOutput(responsePairs.verification));
});

router.post("/signup/verify", (req, res) => {
  const { code } = req.body;
  const index = pendingSignups.findIndex((u) => u.code === Number(code));

  if (index !== -1 && pendingSignups[index].verified) {
    const newUser = pendingSignups[index];

    userData[newUser.username] = {
      password: newUser.password,
      uuid: newUser.uuid,
      verified: false,
    };
    ss.updateData("./data", "userData", userData);

    pendingSignups.splice(index, 1);
    return res.json({ uuid: newUser.uuid, verified: false });
  }
  res.status(400).json({ error: "Code not verified or not found" });
});

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

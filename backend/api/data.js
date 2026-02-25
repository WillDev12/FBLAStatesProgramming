const express = require("express");
const ss = require("@willdevv12/simplestore");

const router = express.Router();
const users = ss.loadData("./data", "userData");
const businessData = ss.loadData("./data", "content");

router.post("/", (req, res) => {
  const { auth } = req.body;

  if (uuidCheck(auth).validation) {
    res.json(businessData);
  } else res.sendStatus(401);
});

router.post("/business/new", (req, res) => {
  const { name, description, areacode, category, auth } = req.body;
  const validation = uuidCheck(auth);

  if (!validation.validation) {
    return res.sendStatus(401);
  }

  // 1. Correct existence check: !(key in object)
  if (!(name in businessData)) {
    // 2. Assign the new object to the key (No .push()!)
    businessData[name] = {
      description: description,
      areaCode: parseInt(areacode),
      category: category,
      reviews: [], // Initialize as empty array so you can .push() reviews later
      avg: 0,
      owner: validation.name,
    };

    ss.updateData("./data", "content", businessData);
    setTimeout(() => {
      return res.sendStatus(201);
    }, 3000);
  } else {
    return res.status(400).json({ error: "Business already exists" });
  }
});

router.post("/business/delete", (req, res) => {
  const { name, auth } = req.body;
  const validation = uuidCheck(auth);

  // 1. Verify User Identity
  if (!validation.validation) {
    return res.status(401).json({ error: "Unauthorized: Invalid session" });
  }

  // 2. Check if business exists
  if (!(name in businessData)) {
    return res.status(404).json({ error: "Business not found" });
  }

  // 3. Authorization Check: Is this user the owner?
  if (businessData[name].owner !== validation.name) {
    return res
      .status(403)
      .json({ error: "Forbidden: You do not own this business" });
  }

  // 4. Delete the business
  // Use the 'delete' operator to remove the key from the object
  delete businessData[name];

  // 5. Sync with your data file
  ss.updateData("./data", "content", businessData);
  setTimeout(() => {
    return res.status(200).json({ message: "Business deleted" });
  }, 3000);
});

/* comment post format: 
{"business": "", "comment": "", "stars": 5, "auth": "..."}
*/
router.post("/comment", (req, res) => {
  const { business, comment, rating, auth } = req.body;
  const validation = uuidCheck(auth);
  const name = validation.name;

  if (validation.validation)
    addComment({ business, comment, rating, name }, res);
  else res.sendStatus(401);
});

function addComment({ business, comment, rating, name }, res) {
  if (business in businessData) {
    const bData = businessData[business];

    // 1. Add the review
    bData.reviews.push({
      user: name,
      comment: comment,
      stars: Number(rating), // Ensure it's a number!
    });

    // 2. Calculate the new average
    const total = bData.reviews.reduce((sum, r) => sum + r.stars, 0);
    const avg = (total / bData.reviews.length).toFixed(1);
    bData.avg = avg;

    // 3. Save and Respond
    ss.updateData("./data", "content", businessData);
    setTimeout(() => {
      return res.sendStatus(201);
    }, 3000);
  } else {
    return res.status(400).send("Business not found");
  }
}

// function addComment({ business, comment, rating, name }, res) {
//   if (business in businessData)
//     businessData[business].reviews.push({
//       user: name,
//       comment: comment,
//       stars: rating,
//     });
//   else res.sendStatus(400);
//   ss.updateData("./data", "content", businessData);
//   res.sendStatus(201);
// }

function uuidCheck(uuid) {
  const freshUsers = ss.loadData("./data", "userData");
  const entry = Object.entries(freshUsers).find(
    ([name, data]) => data.uuid === uuid
  );
  const username = entry ? entry[0] : null;

  if (username != null) return { validation: true, name: username };
  else return { validation: false };
}

module.exports = router;

// Handles all business data routes: fetching listings, creating and deleting
// businesses, and posting comments. Every route requires a valid user UUID
// (auth token) in the request body.

const express = require("express");
const ss = require("@willdevv12/simplestore");

const router = express.Router();
const users = ss.loadData("./data", "userData");
const businessData = ss.loadData("./data", "content");

// POST / — Returns all business listings to authenticated users
router.post("/", (req, res) => {
  const { auth } = req.body;

  if (uuidCheck(auth).validation) {
    res.json(businessData);
  } else res.sendStatus(401);
});

// POST /business/new — Creates a new business listing owned by the authenticated user
router.post("/business/new", (req, res) => {
  const { name, description, areacode, category, auth } = req.body;
  const validation = uuidCheck(auth);

  if (!validation.validation) {
    return res.sendStatus(401);
  }

  if (!(name in businessData)) {
    businessData[name] = {
      description: description,
      areaCode: parseInt(areacode),
      category: category,
      reviews: [],
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

// POST /business/delete — Deletes a business, only if the requester is the owner
router.post("/business/delete", (req, res) => {
  const { name, auth } = req.body;
  const validation = uuidCheck(auth);

  if (!validation.validation) {
    return res.status(401).json({ error: "Unauthorized: Invalid session" });
  }

  if (!(name in businessData)) {
    return res.status(404).json({ error: "Business not found" });
  }

  // Only the business owner can delete it
  if (businessData[name].owner !== validation.name) {
    return res
      .status(403)
      .json({ error: "Forbidden: You do not own this business" });
  }

  delete businessData[name];

  ss.updateData("./data", "content", businessData);
  setTimeout(() => {
    return res.status(200).json({ message: "Business deleted" });
  }, 3000);
});

// POST /comment — Adds a review to a business and recalculates its average rating
router.post("/comment", (req, res) => {
  const { business, comment, rating, auth } = req.body;
  const validation = uuidCheck(auth);
  const name = validation.name;

  if (validation.validation)
    addComment({ business, comment, rating, name }, res);
  else res.sendStatus(401);
});

// Pushes a new review onto the business, recalculates the average star rating,
// then saves the updated data to disk
function addComment({ business, comment, rating, name }, res) {
  if (business in businessData) {
    const bData = businessData[business];

    bData.reviews.push({
      user: name,
      comment: comment,
      stars: Number(rating),
    });

    // Recalculate average rating across all reviews
    const total = bData.reviews.reduce((sum, r) => sum + r.stars, 0);
    const avg = (total / bData.reviews.length).toFixed(1);
    bData.avg = avg;

    ss.updateData("./data", "content", businessData);
    setTimeout(() => {
      return res.sendStatus(201);
    }, 3000);
  } else {
    return res.status(400).send("Business not found");
  }
}

// Looks up a UUID against the user store and returns the matching username.
// Re-reads from disk on every call to catch any updates made since startup.
function uuidCheck(uuid) {
  const freshUsers = ss.loadData("./data", "userData");
  const entry = Object.entries(freshUsers).find(
    ([name, data]) => data.uuid === uuid,
  );
  const username = entry ? entry[0] : null;

  if (username != null) return { validation: true, name: username };
  else return { validation: false };
}

module.exports = router;

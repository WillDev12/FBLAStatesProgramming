const express = require("express");
const ss = require("@willdevv12/simplestore");

const router = express.Router();
const users = ss.loadData("./data", "userData");
const businessData = ss.loadData("./data", "content");

router.get("/", (req, res) => {
  const { key } = req.body;
  if (key !== process.env.adminKey) return res.status(401).end();
  res.json(businessData);
});

router.delete("/business/:name", (req, res) => {
  const { key } = req.body;
  if (key !== process.env.adminKey) return res.status(401).end();

  const name = decodeURIComponent(req.params.name);
  if (!(name in businessData)) return res.status(404).json({ error: "Business not found" });

  delete businessData[name];
  ss.updateData("./data", "content", businessData);
  res.json({ message: "Business deleted" });
});

router.delete("/business/:name/comment/:index", (req, res) => {
  const { key } = req.body;
  if (key !== process.env.adminKey) return res.status(401).end();

  const name = decodeURIComponent(req.params.name);
  const index = parseInt(req.params.index);

  if (!(name in businessData)) return res.status(404).json({ error: "Business not found" });

  const biz = businessData[name];
  if (isNaN(index) || index < 0 || index >= biz.reviews.length)
    return res.status(400).json({ error: "Invalid comment index" });

  biz.reviews.splice(index, 1);
  biz.avg = biz.reviews.length === 0
    ? 0
    : (biz.reviews.reduce((sum, r) => sum + r.stars, 0) / biz.reviews.length).toFixed(1);

  ss.updateData("./data", "content", businessData);
  res.json({ message: "Comment deleted" });
});

router.post("/", (req, res) => {
  const { auth } = req.body;

  if (uuidCheck(auth).validation) {
    const freshUsers = ss.loadData("./data", "userData");
    const annotated = {};
    for (const [bizName, biz] of Object.entries(businessData)) {
      annotated[bizName] = {
        ...biz,
        ownerVerified: !!(freshUsers[biz.owner] && freshUsers[biz.owner].verified),
        reviews: biz.reviews.map(r => ({
          ...r,
          userVerified: !!(freshUsers[r.user] && freshUsers[r.user].verified),
        })),
      };
    }
    res.json(annotated);
  } else res.sendStatus(401);
});

router.post("/business/new", (req, res) => {
  const { name, description, areacode, category, auth } = req.body;
  const validation = uuidCheck(auth);

  if (!validation.validation) {
    return res.sendStatus(401);
  }

  if (!name || !description || !areacode || !category) {
    return res.status(400).json({ error: "Missing required fields" });
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

router.post("/business/delete", (req, res) => {
  const { name, auth } = req.body;
  const validation = uuidCheck(auth);

  if (!validation.validation) {
    return res.status(401).json({ error: "Unauthorized: Invalid session" });
  }

  if (!(name in businessData)) {
    return res.status(404).json({ error: "Business not found" });
  }

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

    bData.reviews.push({
      user: name,
      comment: comment,
      stars: Number(rating),
    });

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
module.exports.businessData = businessData;

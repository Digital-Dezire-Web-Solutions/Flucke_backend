const router = require("express").Router();
const fetchuser = require("../middleware/fetchUser");

const {
  getWishlist,
  addWishlist,
  removeWishlist,
} = require("../controllers/wishlistController");

router.get("/", fetchuser, getWishlist);

router.post("/", fetchuser, addWishlist);

router.delete("/:id", fetchuser, removeWishlist);

module.exports = router;

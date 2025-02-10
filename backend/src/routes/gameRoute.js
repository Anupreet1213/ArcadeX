const express = require("express");
const {
  addGame,
  deleteGame,
  approveGame,
  rejectGame,
  allGames,
  gameBannerUpload,
} = require("../controllers/gameController");
const sellerAuth = require("../middlewares/sellerAuth");
const adminAuth = require("../middlewares/adminAuth");
const cloudinary = require("../config/cloudinary");
const upload = require("../middlewares/multerMiddleware");
const router = express.Router();
const fs = require("fs");

router.post("/addGame", sellerAuth, addGame);
router.delete("/deleteGame", sellerAuth, deleteGame);
router.patch("/approveGame", sellerAuth, approveGame);
router.patch("/rejectGame", sellerAuth, rejectGame);

router.get("/allGames", adminAuth, allGames);

// router.post("/uploadBanner", multerMiddleware, gameBannerUpload);
// router.post("/uploadBanner", upload.single("image"), gameBannerUpload);
// router.post("/uploadPreviews", uploadPreviews.array(), gameBannerUpload);

router.post("/uploadBanner", upload.single("image"), function (req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  cloudinary.uploader.upload(req.file.path, function (err, result) {
    if (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error",
      });
    }

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });

    res.status(200).json({
      success: true,
      message: "Uploaded!",
      data: result,
    });
  });
});

router.post(
  "/uploadPreviews",
  upload.array("image", 5),
  async function (req, res) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    try {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path)
      );

      const results = await Promise.all(uploadPromises);

      req.files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(`Error deleting file ${file.path}:`, err);
          }
        });
      });

      res.status(200).json({
        success: true,
        message: "Files Uploaded!",
        data: results,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Error uploading files",
      });
    }
  }
);

module.exports = router;

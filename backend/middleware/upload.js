import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const IMAGE_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

export const uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are accepted (JPEG, PNG, WebP, GIF, HEIC)"), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const MERGE_TYPES = new Set([
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "image/gif", "image/heic", "image/heif",
]);

export const uploadAny = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (MERGE_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files accepted"), false);
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
});

/**
 * PDF Upload & Vectorstore routes
 * - Upload des fichiers PDF via Multer
 * - Validation des fichiers et de l'utilisateur
 * - Appel d'un script Python pour chunker et stocker dans le vectorstore
 */

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");
const { validateUploadedPDFs } = require("../utils/validation/fileValidation");
const { createUserRateLimiter } = require("../utils/rateLimiter");
const { runPythonScript } = require("../utils/pythonRunner");
const {
  getUserVectorstorePath,
  createUploadTempDir,
} = require("../utils/fileUtils");
const InvalidFileTypeError = require("../errors/InvalidFileTypeError");

const router = express.Router();
router.use(verifyFirebaseToken);

// --- Multer config --- //
const uploadDir = createUploadTempDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // dossier où enregistrer
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + process.env.PDF_EXTENSION);
  },
});

const fileFilter = function (req, file, cb) {
  if (!file.originalname.toLowerCase().endsWith(process.env.PDF_EXTENSION)) {
    return cb(
      new InvalidFileTypeError(
        `Invalid extension : ${file.originalname} is not .pdf`,
      ),
      false,
    );
  }
  if (file.mimetype !== process.env.ALLOWED_FILE_TYPES) {
    return cb(new InvalidFileTypeError("Only PDFs allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_MB) * 1024 * 1024, // Maximum size for each file (bytes)
    files: Number(process.env.MAX_FILES_PER_UPLOAD), // Maximum number of files
  },
});

// --- Rate limiter --- //
const uploadRateLimiter = createUserRateLimiter(
  Number(process.env.RATE_LIMIT_UPLOAD_WINDOW),
  Number(process.env.RATE_LIMIT_UPLOAD_MAX),
  "Too many uploads. Please wait before uploading again.",
);

/**
 * POST /
 * Upload de fichiers PDF → validation → appel du script Python pour chunker et stocker les embeddings dans le vectorstore.
 */
router.post(
  "/",
  uploadRateLimiter,
  upload.array("pdfs"),
  async (req, res, next) => {
    try {
      // Vérification fichiers
      if (!req.files || req.files.length === 0) {
        throw new InvalidFileTypeError("No file uploaded");
      }
      await validateUploadedPDFs(req.files);

      // Préparation des données pour le script Python
      const filesWithMetadata = req.files.map((f) => ({
        storedPath: path.resolve(f.path),
        originalName: f.originalname,
      }));

      const firebaseUid = req.firebaseUser.uid;
      const vectorstorePath = getUserVectorstorePath(firebaseUid);
      const pdfPaths = filesWithMetadata.map((f) => f.storedPath);
      const pdfMetadataMap = Object.fromEntries(
        filesWithMetadata.map((f) => [f.storedPath, f.originalName]),
      );

      const params = {
        pdf_paths: pdfPaths,
        pdf_metadata_map: pdfMetadataMap,
      };

      const inputs = {};

      // Appel du script Python
      await runPythonScript({
        scriptPath: process.env.KEDRO_SCRIPT_PATH,
        pipeline: process.env.KEDRO_EMBEDDING_PIPELINE,
        inputs: inputs,
        params: params,
        vectorstorePath: vectorstorePath,
        cleanup: () => fs.rmSync(uploadDir, { recursive: true, force: true }), // Supprime le dossier temporaire contenant tous les fichiers
      });
      res.status(200).json({
        status: "ok",
        message: "File uploaded successfully.",
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
);

module.exports = router;

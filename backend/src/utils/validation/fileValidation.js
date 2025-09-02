const fs = require("fs");
const FileType = require("file-type");
const InvalidFileTypeError = require("../../errors/InvalidFileTypeError");

/**
 * Vérifie si tous les fichiers uploadés sont bien des PDFs valides.
 * Supprime immédiatement ceux qui ne passent pas.
 *
 * @param {Array} files - Les fichiers uploadés (req.files)
 * @returns {Promise<void>} - Lance une erreur si un fichier n'est pas valide
 */
async function validateUploadedPDFs(files) {
  for (const file of files) {
    const buffer = fs.readFileSync(file.path);
    const type = await FileType.fileTypeFromBuffer(buffer);

    if (type?.mime !== process.env.ALLOWED_FILE_TYPES) {
      fs.unlinkSync(file.path); // suppression immédiate
      throw new InvalidFileTypeError(`${file.originalname} is not a real PDF`);
    }
  }
}

module.exports = { validateUploadedPDFs };

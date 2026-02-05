const HttpError = require("./HttpError");

class InvalidFileTypeError extends HttpError {
  constructor(message = "Invalid file type") {
    super(400, message);
  }
}

module.exports = InvalidFileTypeError;

const HttpError = require("./HttpError");

class ValidationError extends HttpError {
  constructor(message = "Invalid input") {
    super(400, message);
  }
}

module.exports = ValidationError;

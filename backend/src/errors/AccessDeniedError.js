const HttpError = require("./HttpError");

class AccessDeniedError extends HttpError {
  constructor(message = "Access denied") {
    super(403, message);
  }
}

module.exports = AccessDeniedError;

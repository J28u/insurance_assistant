const HttpError = require("./HttpError");

class PythonProcessError extends HttpError {
  constructor(message = "Internal server error") {
    super(500, message);
  }
}

module.exports = PythonProcessError;

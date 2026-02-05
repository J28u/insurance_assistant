class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor); // Nettoie la stack trace pour ne pas inclure le constructeur de l'erreur custom
  }
}

module.exports = HttpError;

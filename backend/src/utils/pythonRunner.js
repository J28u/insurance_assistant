const { spawn } = require("child_process");
const path = require("path");
const PythonProcessError = require("../errors/PythonProcessError");

/**
 * Lance un script Python avec logs temps réel et retourne une promesse.
 *
 * @param {Object} options
 * @param {string} options.scriptPath - chemin du script Python (relatif à __dirname du routeur)
 * @param {string} options.pipeline - nom du pipeline Kedro à exécuter
 * @param {Object} [options.inputs] - paramètres "inputs" sérialisés en JSON
 * @param {Object} [options.params] - paramètres "params" sérialisés en JSON
 * @param {string} [options.outputPath] - chemin de sortie
 * @param {boolean} [options.captureOutput=false] - si true, retourne le stdout du script
 * @param {Function} [options.cleanup] - callback à exécuter après la fin (succès ou erreur)
 * @returns {Promise<string|void>} - stdout si captureOutput=true, sinon void
 */
function runPythonScript({
  scriptPath,
  pipeline,
  inputs = {},
  params = {},
  outputPath,
  captureOutput = false,
  cleanup,
}) {
  return new Promise((resolve, reject) => {
    const args = [
      path.resolve(__dirname, scriptPath),
      pipeline,
      JSON.stringify(inputs),
      JSON.stringify(params),
      outputPath,
    ];
    if (outputPath) args.push(outputPath);

    const python = spawn("python", args);
    let stdoutData = "";

    // Affiche les logs Python en temps réel dans la console Node.js
    python.stdout.on("data", (data) => {
      process.stdout.write(data.toString());
      if (captureOutput) stdoutData += data.toString();
    });
    python.stderr.on("data", (data) => process.stderr.write(data.toString()));

    // Quand le processus Python se termine (code = code de sortie du script; 0 succès complet, autre : erreur côté Python):
    python.on("close", (code) => {
      if (cleanup) cleanup();
      if (code !== 0)
        return reject(
          new PythonProcessError("Error while processing Python script")
        );
      if (captureOutput) return resolve(stdoutData);
      resolve();
    });

    // Quand le processus Python ne peut pas démarrer (erreur côté Node.js):
    python.on("error", (err) => {
      if (cleanup) cleanup();
      console.error("Python error details:", err);
      reject(new PythonProcessError("Error while processing files"));
    });
  });
}

module.exports = { runPythonScript };

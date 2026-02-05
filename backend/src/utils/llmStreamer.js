const fetch = require("node-fetch");

/**
 * Nettoie et sécurise les messages précédents avant de les envoyer au LLM.
 *
 * Pour chaque message :
 *  - Vérifie que le rôle est "user" ou "assistant", sinon remplace par "user".
 *  - S'assure que le contenu est une string et tronque si trop long.
 *
 * @param {Array<{role: string, content: string}>} userPreviousMessages - Tableau des messages précédents.
 * @returns {Array<{role: string, content: string}>} - Tableau des messages sécurisés et tronqués.
 */
function safePreviousMessages(userPreviousMessages) {
  const safeMessages = userPreviousMessages.map((msg) => {
    const role = ["user", "assistant"].includes(msg.role) ? msg.role : "user";
    let content = typeof msg.content === "string" ? msg.content : "";
    const maxLength = Number(process.env.PREVIOUS_MESSAGE_MAX_LENGTH);
    if (content.length > maxLength) content = content.slice(0, maxLength);
    return { role, content };
  });
  return safeMessages;
}

/**
 * Stream la réponse d’un LLM et l’envoie au frontend en temps réel.
 *
 * Cette fonction :
 *  - Appelle l’API LLM en streaming avec les messages fournis.
 *  - Lit les chunks de la réponse et les envoie au client via `res.write()`.
 *  - Concatène les chunks pour retourner la réponse complète à la fin.
 *  - Supporte l’annulation via un AbortSignal.
 *
 * @param {Array<Object>} messages - Tableau de messages pour le LLM. Chaque message doit avoir la forme { role: string, content: string }.
 * @param {AbortSignal} signal - Signal pour pouvoir annuler la requête fetch vers le LLM.
 * @param {import('express').Response} res - Objet Response d’Express pour envoyer les chunks au frontend.
 * @returns {Promise<string>} - La réponse complète du LLM concaténée à partir des chunks.
 * @throws {Error} - Si l’appel au LLM échoue ou si le body est vide.
 *
 * @example
 * const answer = await streamLLMResponse(
 *   llmMessages,
 *   controller.signal,
 *   res
 * );
 */
async function streamLLMResponse(messages, signal, res) {
  const llmStream = await fetch(process.env.API_URL_CHAT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.MODEL_CHAT,
      messages: safePreviousMessages(messages),
      stream: true,
      temperature: Number(process.env.TEMPERATURE_MODEL_CHAT),
    }),
    signal: signal,
  });

  if (!llmStream.ok || !llmStream.body) {
    throw new Error("Erreur appel LLM");
  }

  const decoder = new TextDecoder();
  let answer = "";

  llmStream.body.on("data", (chunk) => {
    const text = decoder.decode(chunk, { stream: true });

    const matches = text.match(/"content":"(.*?)"/g); // Récupère uniquement le champs "response"
    if (matches) {
      const newText = matches
        .map((m) => m.replace(/"content":"/, "").replace(/"$/, "")) // Si correspondance, enlève "response:" puis, enlève les guillemets
        .join(""); // join au cas où plusieurs occurences

      answer += newText;
      res.write(newText); // stream vers le frontend
    }
  });

  await new Promise((resolve, reject) => {
    llmStream.body.on("end", resolve);
    llmStream.body.on("error", reject);
  });

  return answer;
}

module.exports = { streamLLMResponse, safePreviousMessages };

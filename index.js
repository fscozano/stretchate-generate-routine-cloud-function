import { Mistral } from '@mistralai/mistralai';

/**
 * Classe che gestisce l'interazione con Mistral AI.
 * Imita la struttura della classe ClaudeService in Dart.
 */
class MistralService {
  constructor(apiKey, logger) {
    this.logger = logger;
    
    if (!apiKey) {
      throw new Error('Mistral API Key mancante');
    }

    // Inizializzazione del client Mistral
    this.client = new Mistral({ apiKey: apiKey });
    this.logger('Mistral Service inizializzato con API key');
  }

  /**
   * Invia un messaggio a Mistral AI.
   * * @param {string} systemPrompt - Il prompt di sistema (contesto).
   * @param {string} userMessage - Il messaggio dell'utente.
   * @param {number} maxTokens - Limite token (default 1000).
   * @returns {Promise<string>} - Il testo della risposta.
   */
  async sendMessage({ systemPrompt, userMessage, maxTokens = 1000 }) {
    try {
      // Mistral gestisce il system prompt come un messaggio con ruolo 'system'
      // all'interno dell'array dei messaggi, diversamente da Claude che ha un parametro dedicato.
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Chiamata all'API di Mistral
      // Usiamo 'mistral-large-latest' per avvicinarci alle capacità di Claude Sonnet
      const chatResponse = await this.client.chat.complete({
        model: 'mistral-large-latest', 
        messages: messages,
        maxTokens: maxTokens, 
      });

      // Estrazione del contenuto testuale (equivalente a response.content.text in Dart)
      if (chatResponse.choices && chatResponse.choices.length > 0) {
        return chatResponse.choices[0].message.content;
      } else {
        throw new Error('Risposta vuota ricevuta da Mistral AI');
      }

    } catch (error) {
      this.logger(`Error in Mistral service: ${error.message}`);
      // Rilancia l'errore per gestirlo nel main della function
      throw error;
    }
  }
}

/**
 * Entry point della Appwrite Cloud Function
 */
export default async ({ req, res, log, error }) => {
  // 1. Recupero della API Key dalle variabili d'ambiente di Appwrite
  const apiKey = process.env.MISTRAL_API_KEY || '';

  // 3. Verifica metodo HTTP (opzionale ma consigliato)
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  try {
    // 2. Inizializzazione del servizio
    const mistralService = new MistralService(apiKey, log);

    // 4. Parsing del body della richiesta
    // Appwrite fornisce il body già parsato se è JSON, altrimenti lo parsa qui.
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const { systemPrompt, userMessage, maxTokens } = payload;

    // Validazione input base
    if (!systemPrompt || !userMessage) {
      return res.json({ 
        success: false, 
        error: 'Parametri mancanti: systemPrompt e userMessage sono obbligatori.' 
      }, 400);
    }

    // 5. Esecuzione della chiamata
    const responseText = await mistralService.sendMessage({
      systemPrompt,
      userMessage,
      maxTokens: maxTokens || 1000
    });

    // 6. Restituzione del risultato
    return res.json({
      success: true,
      data: responseText
    });

  } catch (err) {
    error(`Function execution failed: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};
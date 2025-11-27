import { Mistral } from '@mistralai/mistralai';

/**
 * Classe che gestisce l'interazione con Mistral AI.
 * Imita la struttura della classe ClaudeService in Dart.
 */
class MistralService {
  constructor(apiKey, logger) {
    this.logger = logger;
    // Controlla se siamo in modalità demo (chiave vuota o stringa specifica)
    this.isDemo = !apiKey || apiKey === 'demo-key';
    
    if (this.isDemo) {
      this.client = null;
      this.logger('Mistral Service inizializzato in modalità DEMO (no API key)');
    } else {
      // Inizializzazione del client Mistral
      this.client = new Mistral({ apiKey: apiKey });
      this.logger('Mistral Service inizializzato con API key');
    }
  }

  /**
   * Invia un messaggio a Mistral AI.
   * * @param {string} systemPrompt - Il prompt di sistema (contesto).
   * @param {string} userMessage - Il messaggio dell'utente.
   * @param {number} maxTokens - Limite token (default 1000).
   * @returns {Promise<string>} - Il testo della risposta.
   */
  async sendMessage({ systemPrompt, userMessage, maxTokens = 1000 }) {
    // Simulazione comportamento Dart: se il client è null (demo), generiamo errore o risposta fittizia.
    if (!this.client) {
      const error = new Error('Tentativo di inviare messaggio in modalità DEMO senza client attivo.');
      this.logger(error.message);
      throw error;
    }

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

  // 2. Inizializzazione del servizio
  const mistralService = new MistralService(apiKey, log);

  // 3. Verifica metodo HTTP (opzionale ma consigliato)
  if (req.method !== 'POST') {
    return res.json({ error: 'Method not allowed' }, 405);
  }

  try {
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

    if (mistralService.isDemo) {
      return res.json({
        success: true,
        message: "Modalità DEMO: Il servizio è attivo. Nessuna chiamata API reale a Mistral.",
        data: `[DEMO OUTPUT] Ho ricevuto il tuo messaggio: "${userMessage}". Questa è una risposta simulata per testare il flusso.`
      });
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
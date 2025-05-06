import axios from 'axios';
import FormData from 'form-data';
import https from 'https';
import fs from 'fs'; // Aggiunto per operazioni su file system
import path from 'path'; // Aggiunto per la gestione dei percorsi
import { fileURLToPath } from 'url'; // Aggiunto per __dirname in ES modules

/**
 * Chiama la nuova API LLM per ottenere una risposta.
 * @param {string} transcriptionText Il testo della trascrizione da inviare.
 * @returns {Promise<any>} La risposta dall'API LLM.
 */
async function callNewLlmApi(transcriptionText) {
  const apiUrl = 'https://dev.brainyware.ai/bw-avatar/answer';
  const formData = new FormData();

  formData.append('token', 'DummyTKN');
  formData.append('language', 'it');
  formData.append('transcription', transcriptionText);
  formData.append('stream', 'false');
  formData.append('voice', 'male_it.wav');

  const agent = new https.Agent({
    rejectUnauthorized: false, // Equivalente a -k di curl
  });

  try {
    const response = await axios.post(apiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      httpsAgent: agent,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Errore nella chiamata API LLM:', error.response.status, error.response.data);
    } else {
      console.error('Errore imprevisto nella chiamata API LLM:', error.message);
    }
    throw error;
  }
}

// Funzione principale per testare e salvare i risultati
async function testAndSave() {
  const transcription = "Come posso fare uno switch?"; // Testo di input
  console.log(`Inizio test API LLM con trascrizione: "${transcription}"`);

  try {
    const result = await callNewLlmApi(transcription);
    console.log('Risposta API ricevuta.');

    // Determina la directory corrente e la cartella di output
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Salva nella cartella response_LLM che sarà creata dentro la cartella 'promt3d'
    // se lo script src/testLLM.js è eseguito dalla root del progetto 'promt3d'
    // o se è eseguito da src, la cartella sarà creata a livello di src.
    // Per coerenza, creiamola sempre un livello sopra src, quindi dentro promt3d.
    const baseDir = path.resolve(__dirname, '..'); // Va alla cartella promt3d
    const responseDir = path.join(baseDir, 'response_LLM');


    if (!fs.existsSync(responseDir)) {
      fs.mkdirSync(responseDir, { recursive: true });
      console.log(`Cartella creata: ${responseDir}`);
    }

    // Salva il testo generato (assumendo che la risposta contenga un campo 'text')
    if (result && result.text) {
      const textPath = path.join(responseDir, 'output_llm_text.txt');
      fs.writeFileSync(textPath, result.text);
      console.log(`Testo LLM salvato in: ${textPath}`);
    } else {
      console.log('Nessun campo "text" trovato nella risposta LLM o risposta nulla.');
    }

    // Salva l'audio (assumendo campi 'audio' e 'audio_format')
    if (result && result.audio && result.audio_format) {
      const audioFormat = result.audio_format || 'wav';
      const fileExtension = audioFormat.toLowerCase().includes('mp3') ? 'mp3' : 'wav';
      const outputPath = path.join(responseDir, `output_llm_audio.${fileExtension}`);
      const audioBuffer = Buffer.from(result.audio, 'base64');
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`Audio LLM salvato in: ${outputPath}`);
    } else {
      console.log('Nessun campo "audio" o "audio_format" trovato nella risposta LLM o risposta nulla.');
    }

    // Salva la risposta JSON completa per debug
    const jsonPath = path.join(responseDir, 'response_llm.json');
    const jsonDataToSave = result ? { ...result } : { error: "Risposta API LLM nulla o indefinita" };
    if (jsonDataToSave.audio) {
      jsonDataToSave.audio = `[Base64 audio data, lunghezza: ${jsonDataToSave.audio.length}]`;
    }
    fs.writeFileSync(jsonPath, JSON.stringify(jsonDataToSave, null, 2));
    console.log(`Risposta LLM completa (JSON) salvata in: ${jsonPath}`);

  } catch (e) {
    console.error('Test API LLM fallito.');
    // L'errore specifico della chiamata API è già loggato da callNewLlmApi
  }
}

// Esegui il test
testAndSave();
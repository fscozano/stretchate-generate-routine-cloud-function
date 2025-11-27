import main from './index.js';

// Mock objects for Appwrite Cloud Function
const req = {
  method: 'POST',
  body: {
    systemPrompt: 'You are a helpful assistant.',
    userMessage: 'Hello, does this work?',
    maxTokens: 100
  }
};

const res = {
  json: (data, statusCode = 200) => {
    console.log('--- Response ---');
    console.log('Status Code:', statusCode);
    console.log('Body:', JSON.stringify(data, null, 2));
    return { statusCode, body: data };
  }
};

const log = (msg) => console.log('[LOG]:', msg);
const error = (msg) => console.error('[ERROR]:', msg);

// Set environment variable for demo mode (ensure it's empty or specific key)
process.env.MISTRAL_API_KEY = 'demo-key'; 

console.log('Starting local test...');
main({ req, res, log, error });

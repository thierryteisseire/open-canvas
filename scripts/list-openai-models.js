#!/usr/bin/env node

/**
 * List available OpenAI models from your API key
 * Usage: node scripts/list-openai-models.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}Error: .env file not found at ${envPath}${colors.reset}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

// Fetch models from OpenAI API
function fetchModels(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`API returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Models configured in Open Canvas
const OPEN_CANVAS_MODELS = [
  'gpt-5.1',
  'gpt-5',
  'gpt-5-mini',
  'o3',
  'o3-mini',
  'o1-pro',
  'o1',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
  'chatgpt-4o-latest',
];

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║                                                       ║');
  console.log('║          OpenAI Models Availability Check            ║');
  console.log('║                                                       ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Load .env file
  loadEnv();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(`${colors.red}Error: OPENAI_API_KEY not found in .env file${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.blue}Fetching models from OpenAI API...${colors.reset}\n`);

  try {
    const response = await fetchModels(apiKey);
    const availableModels = response.data.map(m => m.id);

    console.log(`${colors.green}✓ Successfully fetched ${availableModels.length} models${colors.reset}\n`);

    // Check Open Canvas models
    console.log(`${colors.bright}Open Canvas Model Availability:${colors.reset}\n`);

    const available = [];
    const unavailable = [];

    for (const model of OPEN_CANVAS_MODELS) {
      const isAvailable = availableModels.includes(model);
      if (isAvailable) {
        available.push(model);
        console.log(`  ${colors.green}✓${colors.reset} ${model}`);
      } else {
        unavailable.push(model);
        console.log(`  ${colors.red}✗${colors.reset} ${model} ${colors.yellow}(not available)${colors.reset}`);
      }
    }

    // Summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`  ${colors.green}Available:${colors.reset} ${available.length}/${OPEN_CANVAS_MODELS.length}`);
    if (unavailable.length > 0) {
      console.log(`  ${colors.yellow}Unavailable:${colors.reset} ${unavailable.length}/${OPEN_CANVAS_MODELS.length}`);
    }

    // Show relevant GPT models
    console.log(`\n${colors.bright}All Available GPT/o1/o3 Models:${colors.reset}\n`);
    const relevantModels = availableModels
      .filter(m => m.includes('gpt-') || m.includes('o1') || m.includes('o3') || m.includes('chatgpt'))
      .sort();

    if (relevantModels.length > 0) {
      relevantModels.forEach(model => {
        const inOpenCanvas = OPEN_CANVAS_MODELS.includes(model);
        const marker = inOpenCanvas ? `${colors.green}[configured]${colors.reset}` : '';
        console.log(`  • ${model} ${marker}`);
      });
    } else {
      console.log(`  ${colors.yellow}No GPT/o1/o3 models found${colors.reset}`);
    }

    // Recommendations
    if (unavailable.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}Note:${colors.reset}`);
      console.log(`  Some models may require:${colors.reset}`);
      console.log(`  • API access tier upgrade (e.g., o1 models require tier 5)`);
      console.log(`  • Waitlist approval (e.g., o3-mini)`);
      console.log(`  • Different model naming (check OpenAI docs)`);
    }

    // Export option
    console.log(`\n${colors.blue}To see all models in JSON format, run:${colors.reset}`);
    console.log(`  node scripts/list-openai-models.js --json\n`);

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle --json flag
if (process.argv.includes('--json')) {
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }
  
  fetchModels(apiKey)
    .then(response => {
      console.log(JSON.stringify(response, null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
} else {
  main();
}

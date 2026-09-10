#!/usr/bin/env node
/**
 * PulseStream Production Deployment Pre-Flight Checklist
 * Run before deploying to Render.com or production servers.
 */

const fs = require('fs');
const path = require('path');

// Parse .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

console.log('\n======================================================');
console.log('  PULSESTREAM PRODUCTION PRE-FLIGHT VERIFIER');
console.log('======================================================\n');

let warnings = 0;
let errors = 0;

function checkEnv(key, required = true, isSecret = true) {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    if (required) {
      console.log(`❌ ERROR: Missing required environment variable: ${key}`);
      errors++;
    } else {
      console.log(`⚠️  WARNING: Optional variable not set: ${key}`);
      warnings++;
    }
  } else {
    const masked = isSecret ? val.substring(0, 4) + '...' + val.substring(val.length - 3) : val;
    console.log(`✅ ${key}: ${masked}`);
  }
}

console.log('--- 1. Core Runtime & Security ---');
checkEnv('NODE_ENV', false, false);
checkEnv('PORT', false, false);
checkEnv('DATABASE_URL', true, true);
checkEnv('JWT_SECRET', true, true);
checkEnv('REDIS_URL', false, true);

console.log('\n--- 2. Live Video Ingest & WebRTC ---');
checkEnv('LIVEKIT_API_KEY', false, true);
checkEnv('LIVEKIT_API_SECRET', false, true);
checkEnv('LIVEKIT_URL', false, false);

console.log('\n--- 3. Multi-Processor Payment Gateways ---');
checkEnv('STRIPE_SECRET_KEY', false, true);
checkEnv('CCBILL_ACCOUNT_NO', false, false);
checkEnv('FLUTTERWAVE_SECRET_KEY', false, true);

console.log('\n--- 4. Cloud Media & VOD Storage ---');
checkEnv('STORAGE_PROVIDER', false, false);
checkEnv('R2_ACCOUNT_ID', false, true);
checkEnv('R2_BUCKET_NAME', false, false);

console.log('\n--- 5. Static Assets & Manifests ---');
const filesToCheck = [
  'public/manifest.json',
  'public/sw.js',
  'prisma/schema.prisma',
  'render.yaml',
  'Dockerfile',
  'next.config.mjs',
];

filesToCheck.forEach((file) => {
  if (fs.existsSync(path.resolve(process.cwd(), file))) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    errors++;
  }
});

console.log('\n======================================================');
if (errors === 0) {
  console.log(`🎉 READY FOR PRODUCTION DEPLOYMENT! (${warnings} optional warnings)`);
  console.log('======================================================\n');
  process.exit(0);
} else {
  console.log(`⛔ FAILED PRE-FLIGHT CHECK: ${errors} errors found.`);
  console.log('======================================================\n');
  process.exit(1);
}

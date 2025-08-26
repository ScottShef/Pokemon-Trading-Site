#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Pokemon Trading Site - Cloudflare Deployment Script\n');

// Check if required files exist
const requiredFiles = [
  'wrangler.toml',
  'next.config.js',
  'package.json'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
  console.log(`✅ Found ${file}`);
}

// Check environment variables
console.log('\n🔧 Checking environment variables...');
const requiredEnvVars = [
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Please add them to your .env file or wrangler.toml');
}

// Function to run command with proper error handling
function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'setup':
    console.log('\n📦 Setting up Cloudflare dependencies...');
    runCommand('npm install @opennextjs/cloudflare wrangler --save-dev', 'Installing dependencies');
    console.log('\n🎉 Setup complete! Next steps:');
    console.log('1. Update wrangler.toml with your Turso credentials');
    console.log('2. Run: node deploy.js build');
    console.log('3. Run: node deploy.js deploy');
    break;

  case 'build':
    runCommand('npm run build', 'Building Next.js application');
    runCommand('npx @opennextjs/cloudflare', 'Building for Cloudflare');
    console.log('\n🎉 Build complete! Ready for deployment.');
    break;

  case 'dev':
    console.log('\n🔧 Starting local development with Cloudflare simulation...');
    runCommand('npx @opennextjs/cloudflare && wrangler pages dev', 'Starting development server');
    break;

  case 'deploy':
    console.log('\n🚀 Deploying to Cloudflare...');
    
    // Check if user is logged in to Cloudflare
    try {
      execSync('wrangler whoami', { stdio: 'pipe' });
    } catch (error) {
      console.log('🔐 Please login to Cloudflare first...');
      runCommand('wrangler login', 'Logging in to Cloudflare');
    }

    runCommand('npm run build', 'Building Next.js application');
    runCommand('npx @opennextjs/cloudflare', 'Building for Cloudflare');
    runCommand('wrangler pages deploy', 'Deploying to Cloudflare Pages');
    
    console.log('\n🎉 Deployment complete!');
    console.log('Your Pokemon Trading Site is now live on Cloudflare!');
    break;

  case 'status':
    console.log('\n📊 Checking deployment status...');
    try {
      execSync('wrangler pages list', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Please login first: wrangler login');
    }
    break;

  case 'logs':
    console.log('\n📋 Checking recent logs...');
    try {
      execSync('wrangler pages tail', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Error fetching logs:', error.message);
    }
    break;

  case 'help':
  default:
    console.log(`
📚 Available commands:

  setup     - Install Cloudflare dependencies
  build     - Build the application for Cloudflare
  dev       - Start local development with Cloudflare simulation  
  deploy    - Deploy to Cloudflare Pages
  status    - Check deployment status
  logs      - View application logs
  help      - Show this help message

📖 Usage examples:
  node deploy.js setup
  node deploy.js build
  node deploy.js deploy

🔧 Before deploying:
  1. Update wrangler.toml with your Turso database credentials
  2. Ensure your .env file has all required variables
  3. Test locally with: node deploy.js dev

🌟 Your Pokemon Trading Site will be:
  - Globally distributed
  - Lightning fast
  - Highly scalable
  - Cost effective

🔗 Resources:
  - Cloudflare Docs: https://developers.cloudflare.com/pages/
  - OpenNext Guide: https://opennext.js.org/cloudflare
  - Migration Guide: ./CLOUDFLARE_MIGRATION.md
`);
    break;
}

console.log('\n✨ Happy deploying! 🃏⚡');

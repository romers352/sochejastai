#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

async function main() {
  const args = process.argv.slice(2);
  const providedPassword = args[0];
  
  console.log('🔐 Admin Password Hash Generator\n');
  
  let password;
  if (providedPassword) {
    password = providedPassword;
    console.log('Using provided password...');
  } else {
    password = generateSecurePassword(20);
    console.log('Generated secure password:', password);
  }
  
  console.log('Generating password hash...');
  const hash = await bcrypt.hash(password, 12);
  
  const jwtSecret = generateJWTSecret();
  
  console.log('\n✅ Setup Complete!\n');
  console.log('Add these to your .env file:');
  console.log('=====================================');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log('=====================================\n');
  
  if (!providedPassword) {
    console.log('⚠️  IMPORTANT: Save this password securely!');
    console.log(`Admin Password: ${password}`);
    console.log('\nThis password will not be shown again.');
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Copy the environment variables above to your .env file');
  console.log('2. Restart your development server');
  console.log('3. Use the admin password to log in at /admin/login');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSecurePassword, generateJWTSecret };
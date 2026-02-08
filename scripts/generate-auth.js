const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate cryptographically secure random password (24 chars)
const password = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, 'x').slice(0, 24);

// Generate API key for agent access (32 chars)
const apiKey = crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, 'A').slice(0, 32);

// Hash the password with bcrypt (cost factor 12)
const passwordHash = bcrypt.hashSync(password, 12);

console.log('='.repeat(60));
console.log('ARC FORGE AUTH CREDENTIALS');
console.log('='.repeat(60));
console.log('');
console.log('🔐 USER PASSWORD (save this somewhere safe!):');
console.log(`   ${password}`);
console.log('');
console.log('🤖 API KEY (for agent access):');
console.log(`   ${apiKey}`);
console.log('');
console.log('📋 Add these to Vercel Environment Variables:');
console.log('');
console.log(`BOARD_PASSWORD_HASH=${passwordHash}`);
console.log(`BOARD_API_KEY=${apiKey}`);
console.log(`AUTH_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('');
console.log('='.repeat(60));

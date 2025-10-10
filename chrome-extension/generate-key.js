// Generate a permanent key for Chrome extension
// This ensures the extension ID stays constant during development

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Extract the public key in DER format for Chrome
const publicKeyDer = Buffer.from(
  publicKey
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, ''),
  'base64'
);

// Convert to base64 for manifest.json
const publicKeyBase64 = publicKeyDer.toString('base64');

// Generate extension ID from public key
const hash = crypto.createHash('sha256').update(publicKeyDer).digest();
const extensionId = Array.from(hash.slice(0, 16))
  .map(byte => String.fromCharCode(97 + (byte % 26)))
  .join('');

console.log('\n✅ Generated permanent extension key!\n');
console.log('Extension ID:', extensionId);
console.log('\nAdd this to your manifest.json (at the top level):');
console.log('\n"key": "' + publicKeyBase64 + '"\n');

console.log('Use this Extension ID in Google Cloud Console:');
console.log(extensionId);
console.log('\nAuthorized redirect URI:');
console.log('https://' + extensionId + '.chromiumapp.org/');

// Save the private key (keep this secret!)
fs.writeFileSync(path.join(__dirname, 'extension-private-key.pem'), privateKey);
console.log('\n⚠️  Private key saved to extension-private-key.pem (DO NOT commit to git!)\n');

// Update .gitignore
const gitignorePath = path.join(__dirname, '..', '.gitignore');
let gitignore = '';
if (fs.existsSync(gitignorePath)) {
  gitignore = fs.readFileSync(gitignorePath, 'utf8');
}
if (!gitignore.includes('extension-private-key.pem')) {
  fs.appendFileSync(gitignorePath, '\n# Chrome extension private key\nchrome-extension/extension-private-key.pem\n');
  console.log('✅ Added private key to .gitignore\n');
}

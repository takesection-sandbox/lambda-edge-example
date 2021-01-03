const fs = require('fs');
const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
});
console.log("KeyPair generated.");
fs.open('key.pub', 'w', (err, fd) => {
    if (err) {
        throw err;
    }
    fs.writeFileSync(fd, publicKey.export({
        type: 'spki',
        format: 'pem'
    }));
});
fs.open('key', 'w', (err, fd) => {
    if (err) {
        throw err;
    }
    fs.writeFileSync(fd,privateKey.export({
        type: 'pkcs8',
        format: 'pem'
    }));
});

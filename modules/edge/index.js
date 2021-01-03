const fs = require('fs');
const crypto = require('crypto');
const { default: SignJWT } = require('jose/jwt/sign');
const { default: jwtVerify } = require('jose/jwt/verify');

exports.handler = async function(event, context) {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    if (headers.cookie) {
        for (let i = 0; i < headers.cookie.length; i++) {
            let cookieValue = headers.cookie[i].value;
            if (cookieValue.indexOf('X-JWT=') >= 0) {
                const cookies = cookieValue.split(';');
                for (let j = 0; j < cookies.length; j++) {
                    if (cookies[j].indexOf('X-JWT=') >= 0) {
                        const idx = cookies[j].indexOf('=');
                        const verifyResult = await verify(cookies[j].substring(idx + 1));
                        console.log('verifyResult=', serialize(verifyResult));
                        if (verifyResult) {
                            return request;
                        }
                        break;
                    }
                }
            }
        }
    }

    const maxAge = 60 * 10; // 10 min.
    const privateKey = getPrivateKey();
    const jwt = await sign({'sessionId': 'abcdefg'}, privateKey);
    const response = {
        status: '302',
        statusDescription: 'Found',
        headers: {
            location: [{
                key: 'Location',
                value: 'https://github.com/takesection/lambda-edge-example',
            }],
            'set-cookie': [{
                key: 'Set-Cookie',
                value: 'X-JWT=' + jwt + ';Path=/;Max-Age=' + maxAge + ';Secure'
            }]
        }
    };
    console.log(serialize(response));
    return response;
}

var getPrivateKey = function() {
    const fd = fs.openSync('key', 'r');
    const pem = fs.readFileSync(fd);
    fs.closeSync(fd);
    console.log(pem.toString());
    return crypto.createPrivateKey(pem, {
        type: 'pkcs8',
        format: 'pem'
    });
}

var sign = function(payload, privateKey) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', kid: 'default' })
        .setIssuedAt()
        .setIssuer('urn:example:issuer')
        .setAudience('urn:example:audience')
        .setExpirationTime('5m')
        .sign(privateKey);
}

var getPublicKey = function() {
    const fd = fs.openSync('key.pub', 'r');
    const pem = fs.readFileSync(fd);
    fs.closeSync(fd);
    console.log(pem.toString());
    return crypto.createPublicKey(pem, {
        type: 'spki',
        format: 'pem'
    });
}

var verify = function(jwt) {
    console.log(jwt);
    publicKey = getPublicKey();

    return jwtVerify(jwt, publicKey, {
        issuer: 'urn:example:issuer',
        audience: 'urn:example:audience'
    }).then((result) => {
        console.log("payload=", result.payload);
        console.log("protectedHeader=", result.protectedHeader);
        return true;
    }).catch((err) => {
        console.log("error=", err);
        return false;
    });
}

var serialize = function(object) {
    return JSON.stringify(object, null, 2)
}

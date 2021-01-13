import fs from 'fs';
import crypto, {KeyObject, RsaPrivateKey} from 'crypto';
const SignJWT = require('jose/jwt/sign');
const jwtVerify = require('jose/jwt/verify');

export class Handler {

    async function(event: any, context: any) {
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
                            const verifyResult = await this.verify(cookies[j].substring(idx + 1));
                            console.log('verifyResult=', this.serialize(verifyResult));
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
        const privateKey: KeyObject = this.getPrivateKey();
        const jwt: string = await this.sign({'sessionId': 'abcdefg'}, privateKey);
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
        console.log(this.serialize(response));
        return response;
    }

     getPrivateKey(): KeyObject {
        const fd = fs.openSync('key', 'r');
        const pem = fs.readFileSync(fd);
        fs.closeSync(fd);
        console.log(pem.toString());
        return crypto.createPrivateKey(
            { key: pem,
                type: 'pkcs8',
                format: 'pem'
            });
    }

    sign(payload: any, privateKey: KeyObject) {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: 'RS256', kid: 'default' })
            .setIssuedAt()
            .setIssuer('urn:example:issuer')
            .setAudience('urn:example:audience')
            .setExpirationTime('5m')
            .sign(privateKey);
    }

    getPublicKey(): KeyObject {
        const fd = fs.openSync('key.pub', 'r');
        const pem = fs.readFileSync(fd);
        fs.closeSync(fd);
        console.log(pem.toString());
        return crypto.createPublicKey(
            { key: pem,
                type: 'spki',
                format: 'pem'
            });
    }

    verify(jwt: string) {
        console.log(jwt);
        const publicKey = this.getPublicKey();

        return jwtVerify(jwt, publicKey, {
            issuer: 'urn:example:issuer',
            audience: 'urn:example:audience'
        }).then((result: any) => {
            console.log("payload=", result.payload);
            console.log("protectedHeader=", result.protectedHeader);
            return true;
        }).catch((err: any) => {
            console.log("error=", err);
            return false;
        });
    }

    serialize(object: any) {
        return JSON.stringify(object, null, 2)
    }

}

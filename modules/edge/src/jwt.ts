import crypto, {KeyObject} from 'crypto';
import AWS from 'aws-sdk';
const {default: SignJWT} = require('jose/jwt/sign');
const {default: jwtVerify} = require('jose/jwt/verify');

export class JwtFunctions {

    private s3: AWS.S3;

    constructor() {
        this.s3 = new AWS.S3();
    }

    private _getPublicKey(bucketName: string, keyId: string): Promise<KeyObject> {

        const promise = this.s3.getObject({
            Bucket: bucketName,
            Key: keyId + '/id_rsa.pub'
        }).promise();

        return promise.then((data) => {
            const body = data.Body ? data.Body.toString() : '';
            return crypto.createPublicKey(body);
        });
    }

    private _getPrivateKey(bucketName: string, keyId: string): Promise<KeyObject> {
        const promise = this.s3.getObject({
            Bucket: bucketName,
            Key: keyId + '/id_rsa'
        }).promise();
        return promise.then((data) => {
            const body = data.Body ? data.Body.toString() : '';
            return crypto.createPrivateKey(body);
        });
    }

    public sign(payload: any, bucketName: string, keyId: string): Promise<any> {
        const jwt = new SignJWT(payload)
            .setProtectedHeader({
                alg: 'RS256',
                kid: keyId
            })
            .setIssuedAt()
            .setIssuer('urn:' + bucketName + ':issuer')
            .setAudience('urn:' + bucketName + ':audience')
            .setExpirationTime('5m');
        return this._getPrivateKey(bucketName, keyId).then((privateKey: KeyObject) => {
            return jwt.sign(privateKey);
        })
    }

    private _verify(jwt: string, publicKey: KeyObject, options: any): Promise<boolean> {
        return jwtVerify(jwt, publicKey, options).then((result: any) => {
            return true;
        });
    }

    private _getKeyIdFromHeader(jwt: string): string {
        const {0: encodedheader, 1: payload, 2: signature, length } = jwt.split('.');
        const header: string = Buffer.from(encodedheader, 'base64').toString();
        return JSON.parse(header)['kid'];
    }

    public verify(bucketName: string, jwt: string): Promise<boolean> {
        console.log(jwt);

        const keyId = this._getKeyIdFromHeader(jwt);
        const options = {
            issuer: 'urn:' + bucketName + ':issuer',
            audience: 'urn:' + bucketName + ':audience'
        };
        return this._getPublicKey(bucketName, keyId).then((publicKey: KeyObject) => {
            return this._verify(jwt, publicKey, options);
        });
    }
}

import crypto from 'crypto';
import {v4} from 'uuid';
import AWS from 'aws-sdk';

const uuid = v4();
const bucketName: string = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : '';
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
});

const s3: AWS.S3 = new AWS.S3();

s3.putObject({
    Bucket: bucketName,
    Key: uuid + '/id_rsa.pub',
    Body: publicKey.export({ type: 'spki', format: 'pem'})
}, (err, data) => {
    if (err) {
        throw err;
    }
    console.log(data);
});

const key: object = {
    'kid': uuid,
    'privateKey': privateKey.export({ type: 'pkcs8', format: 'pem' })
}

s3.putObject({
    Bucket: bucketName,
    Key: 'private.json',
    Body: JSON.stringify(key)
}, (err, data) => {
    if (err) {
        throw err;
    }
    console.log(data);
})
console.log('keyId = ' + uuid);

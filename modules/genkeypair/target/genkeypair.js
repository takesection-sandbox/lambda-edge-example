"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importDefault(require("crypto"));
var uuid_1 = require("uuid");
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var uuid = uuid_1.v4();
var bucketName = process.env.BUCKET_NAME ? process.env.BUCKET_NAME : '';
var _a = crypto_1.default.generateKeyPairSync('rsa', {
    modulusLength: 2048
}), publicKey = _a.publicKey, privateKey = _a.privateKey;
var s3 = new aws_sdk_1.default.S3();
s3.putObject({
    Bucket: bucketName,
    Key: uuid + '/id_rsa.pub',
    Body: publicKey.export({ type: 'spki', format: 'pem' })
}, function (err, data) {
    if (err) {
        throw err;
    }
    console.log(data);
});
s3.putObject({
    Bucket: bucketName,
    Key: uuid + '/id_rsa',
    Body: privateKey.export({ type: 'pkcs8', format: 'pem' })
}, function (err, data) {
    if (err) {
        throw err;
    }
    console.log(data);
});
console.log('keyId = ${uuid}');

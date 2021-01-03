Example Lambda@Edge
===================

* [pack-zip](https://www.npmjs.com/package/pack-zip)

![Lambda@Edge](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/images/cloudfront-events-that-trigger-lambda-functions.png)
Source: https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/images/cloudfront-events-that-trigger-lambda-functions.png

# Setup

```
$ (cd deploy/s3; sls deploy -s <STAGE> -v)
$ (cd modules/edge; npm i)
$ (cd modules/edge; node genkeypair.js)
```

# Build

```
$ (cd modules/edge; npm run build-aws-resource)
```

# Deploy

```
$ (cd deploy/edge; sls deploy -s <STAGE> -v)
```

# TODO

* [@tsconfig/node12](https://www.npmjs.com/package/@tsconfig/node12)

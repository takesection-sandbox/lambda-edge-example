import {JwtFunctions} from "./src/jwt";
import {environment} from './environment';

class Controller {
    private jwtFunctions: JwtFunctions;
    private bucketName: string;
    private keyId: string;

    constructor() {
        this.jwtFunctions = new JwtFunctions();
        this.bucketName = environment.BUCKET_NAME;
        this.keyId = environment.KEY_ID;
        console.log(this.jwtFunctions);
        console.log(environment);
        console.log(this.bucketName);
        console.log(this.keyId);
    }

    public async handle(event: any, context: any) {
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
                            const jwt = cookies[j].substring(idx + 1);
                            const verifyResult: boolean = await this.jwtFunctions.verify(this.bucketName, jwt).catch((err) => {
                                    console.log(err);
                                    return false;
                                }
                            );
                            if (verifyResult) {
                                return request;
                            }
                            break;
                        }
                    }
                }
            }
        }

        console.log(request);
        console.log(process.env);
        console.log(this.bucketName);
        console.log(this.keyId);

        const maxAge = 60 * 10; // 10 min.
        const jwt: string = await this.jwtFunctions.sign({'sessionId': 'abcdefg'}, this.bucketName, this.keyId);
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
        console.log(response);
        return response;
    }

}

const controller: Controller = new Controller();
export function handler(event: any, context: any): Promise<any> {
    const result: any =  controller.handle(event, context);
    return result;
}
import {APIGatewayProxyCallback, APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {HandleResult, success, IError, AbstractIO, IIOOptions} from "@skazska/abstract-service-model";

// APIGatewayProxyResult
// statusCode: number;
// headers?: {
//     [header: string]: boolean | number | string;
// };
// multiValueHeaders?: {
//     [header: string]: Array<boolean | number | string>;
// };
// body: string;
// isBase64Encoded?: boolean;

const STAGE_TO_STATUS = {
    'auth': 403,
    'extract': 400,
    'execution': 500,
    'encode': 500
};

export interface IAwsApiGwProxyInput {
    event :APIGatewayProxyEvent,
    context :Context,
    callback :APIGatewayProxyCallback
}

export interface IAwsApiGwProxyIOOptions extends IIOOptions {
    successStatus? :number,
    contentType?: string,
    bodySerializer?: (data: any) => string
    doBase64Encode?: boolean
}

const defaultOptions :IAwsApiGwProxyIOOptions = {
    successStatus :200,
    contentType: 'application/json',
    bodySerializer: data => JSON.stringify(data),
    doBase64Encode: false
};

export abstract class AwsApiGwProxyIO<EI, EO> extends AbstractIO<IAwsApiGwProxyInput, EI, EO, APIGatewayProxyResult> {
    protected options :IAwsApiGwProxyIOOptions;

    protected constructor(
        executable,
        authenticator,
        options?: IAwsApiGwProxyIOOptions
    ) {
        super(executable, authenticator, { ...defaultOptions, ...(options || {})});
    }

    protected fail(stage: string, message: string, errors: IError[]) :HandleResult<APIGatewayProxyResult> {
        return success({
            statusCode: STAGE_TO_STATUS[stage],
            body: JSON.stringify({
                message: message,
                errors: errors.map(err => {
                    let result = {...err};
                    delete result.stack;
                    result.message = err.message; // for native errors
                    return result;
                })
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            isBase64Encoded: false
        });
    };

    protected success(result: EO) :APIGatewayProxyResult {
        const resp = {
            statusCode: this.options.successStatus,
            body: '',
            headers: {
                'Content-Type': this.options.contentType
            },
            isBase64Encoded: this.options.doBase64Encode
        };
        if ((result === null || typeof result === 'undefined')) {
            resp.statusCode = 204;
        } else {
            let body = this.options.bodySerializer(result);
            if (this.options.doBase64Encode) body = Buffer.from(body).toString('base64');
            resp.body = body;
        }

        return resp;
    };
}

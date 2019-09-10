import {APIGatewayProxyCallback, APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {
    success,
    IError,
    AbstractIO,
    IIOOptions,
    isAuthError,
    IAuthTokenResult,
    failure,
    AbstractAuth,
    AbstractExecutable,
    IAuth
} from "@skazska/abstract-service-model";

/**
 * Module provides AwsApiGwProxyIO<EI, EO> class and it's interfaces, which partially implements IO processing for
 * AWS ApiGw proxy method lambda invocation, it implements converting executable success and failure to response for
 * AWS ApiGw, x-auth-token header extraction for authenticator, handler needs to be wrapped with something
 * packing event, context, callback into IAwsApiGwProxyInput
 */

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

/**
 * interface of handler input type
 */
export interface IAwsApiGwProxyInput {
    event :APIGatewayProxyEvent,
    context :Context,
    callback :APIGatewayProxyCallback
}

/**
 * interface of AwsApiGwProxyIO constructor options
 */
export interface IAwsApiGwProxyIOOptions extends IIOOptions {
    // response status for success (defaults to 200)
    successStatus? :number,
    // content type header value for response (defaults to application/json)
    contentType?: string,
    // function to be used to serialize executable success into response body (defaults to JSON.stringify)
    bodySerializer?: (data: any) => string,
    // indicate that serialized response body needs to be base64 encoded (defaults to false)
    doBase64Encode?: boolean
}

const defaultOptions :IAwsApiGwProxyIOOptions = {
    successStatus :200,
    contentType: 'application/json',
    bodySerializer: data => JSON.stringify(data),
    doBase64Encode: false
};

/**
 * Abstract generic class of input and output types of executable to run, provides AWS ApiGw proxy method lambga
 * invocation
 * handler
 */
export abstract class AwsApiGwProxyIO<EI, EO> extends AbstractIO<IAwsApiGwProxyInput, EI, EO, APIGatewayProxyResult> {
    protected options :IAwsApiGwProxyIOOptions;

    /**
     * constructor
     * @param executable - executable to run
     * @param authenticator - authenticator to check auth token
     * @param options - options
     */
    protected constructor(
        executable :AbstractExecutable<EI, EO>,
        authenticator? :IAuth,
        options? :IAwsApiGwProxyIOOptions
    ) {
        super(executable, authenticator, { ...defaultOptions, ...(options || {})});
    }

    /**
     * returns x-auth-token header value or fails
     * @param input
     */
    protected authTokens(input: IAwsApiGwProxyInput): IAuthTokenResult {
        const token = input.event.headers && input.event.headers['x-auth-token'];
        if (!token) return failure([AbstractAuth.error('x-auth-token header missing')]);
        return success(token);
    }

    /**
     * prepares failure response
     * @param stage - stage at which failure occurred
     * @param message - failure message
     * @param errors - failure errors
     */
    protected fail(stage: string, message: string, errors: IError[]) :APIGatewayProxyResult {
        let statusCode :number;
        let error = errors[0];
        if (message === "can't extract tokens") {
            statusCode = 401;
            message = 'Unauthorized'
        } else if (isAuthError(error)) {
            statusCode = 403;
            message = 'Forbidden';
        } else {
            statusCode = STAGE_TO_STATUS[stage];
        }
        return {
            statusCode: statusCode,
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
        };
    };

    /**
     * prepares success response
     * @param result - executable response
     */
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

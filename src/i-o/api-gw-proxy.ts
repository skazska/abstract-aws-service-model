import {APIGatewayProxyCallback, APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";
import {HandleResult, success, IError, AbstractIO} from "@skazska/abstract-service-model";

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
    'validation': 400,
    'execution': 500
};

export interface IAwsApiGwProxyInput {
    event :APIGatewayProxyEvent,
    context :Context,
    callback :APIGatewayProxyCallback
}


export abstract class AwsApiGwProxyIO<EI, EO> extends AbstractIO<IAwsApiGwProxyInput, EI, EO, APIGatewayProxyResult> {
    protected fail(stage: string, message: string, errors: IError[]) :HandleResult<APIGatewayProxyResult> {
        return success({
            statusCode: STAGE_TO_STATUS[stage],
            body: JSON.stringify({
                message: message,
                errors: errors
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    protected success(result: EO) :APIGatewayProxyResult {
        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    };
}

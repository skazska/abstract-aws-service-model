import {APIGatewayProxyResult} from "aws-lambda";
import {HandleResult, success, IError} from "@skazska/abstract-service-model";
import {AwsApiGwIO} from "./api-gw";

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

export abstract class AwsApiGwProxyIO<EI, EO> extends AwsApiGwIO<EI, EO, APIGatewayProxyResult> {
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

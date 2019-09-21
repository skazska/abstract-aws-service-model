import {AwsApiGwProxyIO, IAwsApiGwProxyInput, IAwsApiGwProxyIOOptions} from "../../src";
import {GenericResult, IError, success, IAuthTokenResult, IAuth} from "@skazska/abstract-service-model";
import {APIGatewayProxyResult} from "aws-lambda";
import {TestExecutable} from "./executable";



export class TestIO extends AwsApiGwProxyIO<string, string> {
    constructor(
        executable :TestExecutable,
        authenticator? :IAuth,
        options? :IAwsApiGwProxyIOOptions
    ) {
        super(executable, authenticator, options);
    }

    protected data(inputs: IAwsApiGwProxyInput): GenericResult<string> {
        return success(inputs.event.pathParameters.login);
    }

    testAuthToken(input: IAwsApiGwProxyInput): IAuthTokenResult {
        return this.testAuthToken(input);
    }

    testSuccess(input :string) :APIGatewayProxyResult {
        return this.success(input);
    }

    testFail(stage: string, message: string, errors: IError[]) :APIGatewayProxyResult {
        return this.fail(stage, message, errors);
    }
}

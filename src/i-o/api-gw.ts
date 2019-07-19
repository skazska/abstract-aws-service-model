import {APIGatewayProxyEvent, Context} from "aws-lambda";
import {AbstractIO, GenericResult, IError} from "@skazska/abstract-service-model";

export interface IAwsApiGwInput {
    event :APIGatewayProxyEvent,
    context :Context
}

export abstract class AwsApiGwIO<EI, EO, O> extends AbstractIO<IAwsApiGwInput, EI, EO, O> {
    protected abstract data(inputs: IAwsApiGwInput) :GenericResult<EI, IError>;
}

import {AbstractExecutable, IExecutableConfig, GenericResult, IRunError, success} from "@skazska/abstract-service-model";


export class TestExecutable extends AbstractExecutable<string, string> {
    constructor(props: IExecutableConfig) {
        super(props);
    }

    protected async _execute(params: string): Promise<GenericResult<string, IRunError>> {

        return Promise.resolve(success(params.split('').reverse().join('')));
    }
}

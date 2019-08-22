import {GenericModel, GenericModelFactory, IModelOptions, IModelDataAdepter, ModelValidationResult, GenericResult,
    IModelError,
    success} from "@skazska/abstract-service-model";

export interface ITestKey {
    id :string
}

export interface ITestProps {
    name :string
}

export class TestModel extends GenericModel<ITestKey, ITestProps> {
    constructor (key :ITestKey, properties :ITestProps) {
        super(key, properties);
    }

    protected setOptions(options: IModelOptions) {}
    validate(): ModelValidationResult { return undefined;}
}

class TestModelDataAdapter implements IModelDataAdepter<ITestKey, ITestProps> {
    getKey (data :any) :GenericResult<ITestKey, IModelError> {
        return success({id: data.id});
    };
    getProperties (data :any) :GenericResult<ITestProps, IModelError> {
        let result :ITestProps = {name: data.name};
        return success(result);
    };
    getData(key: ITestKey, properties: ITestProps): any {
        return {...key, ...properties}
    }
}

export class TestModelFactory extends GenericModelFactory<ITestKey, ITestProps> {
    constructor() {
        super(TestModel, new TestModelDataAdapter());
    }
}

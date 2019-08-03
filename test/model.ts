import {GenericModel, GenericModelFactory, IGenericModelOptions, IModelDataAdepter, ModelValidationResult} from "@skazska/abstract-service-model";

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

    protected setOptions(options: IGenericModelOptions<ITestKey, ITestProps>): any {}
    validate(): ModelValidationResult { return undefined;}
}

class TestModelDataAdapter implements IModelDataAdepter<ITestKey, ITestProps> {
    getKey (data :any) :ITestKey {
        return {id: data.id};
    };
    getProperties (data :any) :ITestProps {
        let result :ITestProps = {name: data.name};
        return result;
    };
}

export class TestModelFactory extends GenericModelFactory<ITestKey, ITestProps> {
    constructor() {
        super(TestModel, new TestModelDataAdapter());
    }
}

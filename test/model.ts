import {
    GenericModel,
    GenericModelFactory,
    IModelOptions,
    ModelValidationResult,
    SimpleModelAdapter
} from "@skazska/abstract-service-model";

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

class TestModelDataAdapter extends SimpleModelAdapter<ITestKey, ITestProps> {}

export class TestModelFactory extends GenericModelFactory<ITestKey, ITestProps> {
    constructor() {
        super(TestModel, new TestModelDataAdapter(['id'], ['name']));
    }
}

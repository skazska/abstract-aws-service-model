import {GenericModel, ModelFactory, IGenericModelOptions} from "@skazska/abstract-service-model";

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
}

export class TestModelFactory extends ModelFactory<ITestKey, ITestProps> {
    constructor() {
        super(TestModel);
    }

    dataKey (data :any) :ITestKey {
        return {id: data.id};
    };
    dataProperties (data :any) :ITestProps {
        let result :ITestProps = {name: data.name};
        return result;
    };
}

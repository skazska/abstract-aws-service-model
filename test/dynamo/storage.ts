import {ITestKey, ITestProps} from "./model";
import {DynamodbModelStorage} from "../../src/storage/dynamodb-model";

export class DynamodbTestStorage extends DynamodbModelStorage<ITestKey, ITestProps> {}

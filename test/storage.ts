import {ITestKey, ITestProps} from "./model";
import {DynamodbModelStorage} from "../src/storage";

export class DynamodbTestStorage extends DynamodbModelStorage<ITestKey, ITestProps> {}

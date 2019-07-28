import {ITestKey, ITestProps, TestModel} from "./model";
import {DynamodbModelStorage} from "../src/storage";
// import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";

export class DynamodbTestStorage extends DynamodbModelStorage<ITestKey, ITestProps> {}

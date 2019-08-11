import "mocha";
import {expect, use}  from 'chai';
import {DynamodbTestStorage} from './storage';
import {TestModel, TestModelFactory} from "./model";

import {DynamoDB} from "aws-sdk";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {config as awsConfig} from "aws-sdk/global";

const newStorage = (client :any, modelFactory :TestModelFactory) :DynamodbTestStorage => {
    return new DynamodbTestStorage({
        client: <DocumentClient>client,
        table: 'abstract-aws-model-storage-test',
        modelFactory: modelFactory
    })
};

describe('dynamo-db-storage field test', () => {
    let storage = null;
    let client = null;
    let modelFactory = new TestModelFactory();

    before(() => {
        awsConfig.loadFromPath('./test/.aws-cfg.json');
        client = new DynamoDB.DocumentClient();
        storage = newStorage(client, modelFactory);
    });

    it('load - not found', async () => {
        let result = await storage.load({id: 'id'});
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('not found');
        expect(result.errors[0].source).equal('dynamodb');

    });

    it('load - fail', async () => {
        let result = await storage.load({panama: 'id'});
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('The provided key element does not match the schema');
        expect(result.errors[0].source).equal('dynamodb');
    });


    it('save - success', async () => {
        let model: TestModel = <TestModel>modelFactory.dataModel({id: 'id', name: 'test'}).get();
        let result = await storage.save(model);
        expect(result.get()).eql(model);
    });

    it('save - error', async () => {
        let model: TestModel = <TestModel>modelFactory.dataModel({panama: 'id', name: 'test'}).get();
        let result = await storage.save(model);
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('One or more parameter values were invalid: Missing the key id in the item');
        expect(result.errors[0].source).equal('dynamodb');
    });

    it('load - success', async () => {
        let result = await storage.load({id: 'id'});
        expect(result.isFailure).not.equal(true);
        result = result.get();
        expect(result).be.instanceof(TestModel);
        expect(result.getKey()).eql({id: 'id'});
        expect(result.getProperties()).eql({name: 'test'});
    });

    //TODO
    // it('save update - fail', async () => {
    //     let model: TestModel = <TestModel>modelFactory.dataModel({id: 'id', name: 'test'}).get();
    //     let result = await storage.save(model, {updateExpression: 'update'});
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].description).equal('One or more parameter values were invalid: Missing the key id in the item');
    //     expect(result.errors[0].source).equal('dynamodb');
    // });

    //TODO
    // xit('save update - success', async () => {
        // // update success
        // storage = newStorage(client, modelFactory);
        // client.update = sinon.spy(success({}));
        // result = await storage.save(model, {updateExpression: 'update'});
        // expect(result.get()).eql(model);
        // expect(client.update.args[0][0]).eql({'TableName': 'test', 'Key': {id: 'id'}, "UpdateExpression": "update"});
        //
        // // fail
        // client.update = sinon.spy(fail(new Error('error')));
        // result = await storage.save(model, {updateExpression: 'update'});
        // expect(result.isFailure).equal(true);
        // expect(result.errors[0].description).equal('error');
        // expect(result.errors[0].source).equal('dynamodb');
    // });


});

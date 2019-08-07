import "mocha";
import {expect, use}  from 'chai';

import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {DynamodbTestStorage} from './storage';
import {TestModel, TestModelFactory} from "./model";

import sinon from "sinon";
import sinonChai = require("sinon-chai");
use(sinonChai);

const newStorage = (client :any, modelFactory :TestModelFactory) :DynamodbTestStorage => {
    return new DynamodbTestStorage({
        client: <DocumentClient>client,
        table: 'test',
        modelFactory: modelFactory
    })
};

const success = (result) => {
    return (params, callback) => {
        callback(null, result);
    }
};

const fail = (result) => {
    return (params, callback) => {
        callback(result);
    }
};

describe('dynamo-db-storage', () => {
    let storage = null;
    let client = null;
    let modelFactory = new TestModelFactory();

    before(() => {
       client = {};
    });

    it('constructor', async () => {
        storage = newStorage(client, modelFactory);

        expect(storage.client).eql(client);
        expect(storage.table).eql('test');
        // expect(storage.data({id: 'id'}, {name: 'test'}));
        let newKeyResult = await storage.newKey();
        expect(newKeyResult.isFailure).to.equal(true);
    });

    it('load', async () => {
        // result
        storage = newStorage(client, modelFactory);
        client.get = sinon.spy(success({Item: {id: 'id', name: 'test'}}));
        let result = await storage.load({id: 'id'});
        expect(result.get()).be.instanceof(TestModel);
        expect(client.get.args[0][0]).eql({'TableName': 'test', 'Key': {id: 'id'}});

        // not found
        client.get = sinon.spy(success({}));
        result = await storage.load({id: 'id'});
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('not found');
        expect(result.errors[0].source).equal('dynamodb');

        // fail
        client.get = sinon.spy(fail(new Error('error')));
        result = await storage.load({id: 'id'});
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('error');
        expect(result.errors[0].source).equal('dynamodb');
    });

    it('save', async () => {
        let model :TestModel = <TestModel>modelFactory.dataModel({id: 'id', name: 'test'}).get();
        let result;

        // put success
        storage = newStorage(client, modelFactory);
        client.put = sinon.spy(success({}));
        result = await storage.save(model);
        expect(result.get()).eql(model);
        expect(client.put.args[0][0]).eql({'TableName': 'test', 'Item': {id: 'id', name: 'test'}});

        // fail
        client.put = sinon.spy(fail(new Error('error')));
        result = await storage.save(model);
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('error');
        expect(result.errors[0].source).equal('dynamodb');

        // update success
        storage = newStorage(client, modelFactory);
        client.update = sinon.spy(success({}));
        result = await storage.save(model, {updateExpression: 'update'});
        expect(result.get()).eql(model);
        expect(client.update.args[0][0]).eql({'TableName': 'test', 'Key': {id: 'id'}, "UpdateExpression": "update"});

        // fail
        client.update = sinon.spy(fail(new Error('error')));
        result = await storage.save(model, {updateExpression: 'update'});
        expect(result.isFailure).equal(true);
        expect(result.errors[0].description).equal('error');
        expect(result.errors[0].source).equal('dynamodb');
    });

});

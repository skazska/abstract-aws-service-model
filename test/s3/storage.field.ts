import "mocha";
import {expect, use}  from 'chai';
import {S3TestStorage} from './storage';

import {S3} from "aws-sdk";
import {config as awsConfig} from "aws-sdk/global";
import {RawDataJSONAdapter} from "../../src/storage/s3";

const newStorage = (client :S3, dataAdapter :RawDataJSONAdapter) :S3TestStorage => {
    return new S3TestStorage({
        client: <S3>client,
        bucket: 'cachingtest',
        dataAdapter: dataAdapter
    })
};

describe('s3 field test', function () {
    let storage = null;
    let client = null;
    let dataAdapter = new RawDataJSONAdapter();

    let data = [{data: '12214'}];

    this.timeout(5000);

    before(() => {
        awsConfig.loadFromPath('./test/.aws-cfg.json');
        client = new S3();
        storage = newStorage(client, dataAdapter);
    });

    it('load - not found', async () => {
        let result = await storage.load('s3Storage');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('not found');
        expect(result.errors[0].source).equal('s3');

    });

    // it('load - fail', async () => {
    //     let result = await storage.load('s3None');
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].message).equal('The provided key element does not match the schema');
    //     expect(result.errors[0].source).equal('dynamodb');
    // });


    it('save - success', async () => {
        let result = await storage.save(data, {key: 's3Storage'});
        expect(result.get()).eql(data);
    });

    it('save - overwrite', async () => {
        let result = await storage.save('other data', {key: 's3Storage'});
        expect(result.isFailure).equal(false);
        expect(result.get()).eql('other data');
    });

    it('load - success', async () => {
        let result = await storage.load('s3Storage');
        expect(result.isFailure).not.equal(true);
        result = result.get();
        expect(result).eql('other data');
    });

    //TODO
    // it('save update - fail', async () => {
    //     let model: TestModel = <TestModel>modelFactory.dataModel({id: 'id', name: 'test'}).get();
    //     let result = await storage.save(model, {updateExpression: 'update'});
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].message).equal('One or more parameter values were invalid: Missing the key id in the item');
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
        // expect(result.errors[0].message).equal('error');
        // expect(result.errors[0].source).equal('dynamodb');
    // });

    it('erase - success', async () => {
        let result = await storage.erase('s3Storage');
        expect(result.isFailure).not.equal(true);
        result = result.get();
        expect(result).eql(true);
    });


    it('load - not found', async () => {
        let result = await storage.load('s3Storage');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('not found');
        expect(result.errors[0].source).equal('s3');

    });


});

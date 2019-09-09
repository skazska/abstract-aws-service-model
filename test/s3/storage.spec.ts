import "mocha";
import {expect, use}  from 'chai';

import {AWSError, S3} from 'aws-sdk'
import {IData, S3TestStorage} from './storage';

import sinon from "sinon";
import sinonChai = require("sinon-chai");
import {RawDataJSONAdapter} from "../../src/storage/s3";
use(sinonChai);

const newStorage = (client :S3, dataAdapter :RawDataJSONAdapter) :S3TestStorage => {
    return new S3TestStorage({
        client: <S3>client,
        bucket: 'test',
        dataAdapter: dataAdapter
    })
};

const success = (result) => {
    return (params) => {
        return {
            promise: () => {
                return Promise.resolve(result);
            }
        };
    };
};

const fail = (error) => {
    return (params) => {
        return {
            promise: () => {
                return Promise.reject(error);
            }
        };
    };
};

interface IAWSError {
    message: string;
    code?: string;
}

describe('s3-storage', () => {
    let storage = null;
    let client = null;
    let dataAdapter = new RawDataJSONAdapter();

    let data = [{data: '12214'}];

    const notFoundError :IAWSError  = new Error('Specified key foes not exists');
    notFoundError.code = 'NoSuchKey';

    before(() => {
       client = {};
    });

    it('constructor', async () => {
        storage = newStorage(client, dataAdapter);

        expect(storage.client).eql(client);
        expect(storage.bucket).eql('test');
        expect(storage.dataAdapter).instanceof(RawDataJSONAdapter);

        let newKeyResult = await storage.newKey();
        expect(newKeyResult.isFailure).to.equal(true);
    });

    it('load', async () => {
        let result;
        // result
        storage = newStorage(client, dataAdapter);
        client.getObject = sinon.spy(success({Body: JSON.stringify(data)}));
        result = await storage.load('12214');
        expect(result.get()).eql(data);
        expect(client.getObject.args[0][0]).eql({'Bucket': 'test', 'Key': '12214'});

        // not found
        client.getObject = sinon.spy(fail(notFoundError));
        result = await storage.load('12214');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('not found');
        expect(result.errors[0].source).equal('s3');

        // fail
        client.getObject = sinon.spy(fail(new Error('error')));
        result = await storage.load('12214');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('error');
        expect(result.errors[0].source).equal('s3');
    });

    it('save', async () => {
        let result;

        // put success
        storage = newStorage(client, dataAdapter);
        client.putObject = sinon.spy(success({}));
        result = await storage.save(data, {key: '12214'});
        expect(result.get()).eql(data);
        expect(client.putObject.args[0][0]).eql({'ACL': 'private', 'Bucket': 'test', 'Key': '12214', 'Body': JSON.stringify(data)});

        // fail
        client.putObject = sinon.spy(fail(new Error('error')));
        result = await storage.save(data);
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('error');
        expect(result.errors[0].source).equal('s3');

    });

    it('erase', async () => {
        // result
        storage = newStorage(client, dataAdapter);
        client.deleteObject = sinon.spy(success({}));
        let result = await storage.erase('12214');
        expect(result.get()).eql(true);
        expect(client.deleteObject.args[0][0]).eql({'Bucket': 'test', 'Key': '12214'});

        // not found
        client.deleteObject = sinon.spy(fail(notFoundError));
        result = await storage.erase('12214');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('not found');
        expect(result.errors[0].source).equal('s3');

        // fail
        client.deleteObject = sinon.spy(fail(new Error('error')));
        result = await storage.erase('12214');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('error');
        expect(result.errors[0].source).equal('s3');
    });

});

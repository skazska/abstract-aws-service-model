import "mocha";
import {expect, use}  from 'chai';

import {SecretsManager} from 'aws-sdk'
import {IData, SecretTestStorage} from './storage';
import {SecretStorage} from '../../src/storage/secret'

import sinon from "sinon";
import sinonChai = require("sinon-chai");
import {RawDataJSONAdapter} from "../../src/storage/s3";
use(sinonChai);

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

const secretData = {
    secret :'secret'
};

const secretResponse = JSON.stringify(secretData);

describe('secrets-storage', () => {
    let storage = null;
    let client = null;
    let dataAdapter = null; // new RawDataJSONAdapter();
    let secretStub;

    // let data = [{data: '12214'}];

    const notFoundError :IAWSError  = new Error('Specified key foes not exists');
    notFoundError.code = 'ResourceNotFoundException';

    before(() => {
        client = SecretStorage.getDefaultClient();
        dataAdapter = new RawDataJSONAdapter();
    });

    it('constructor', async () => {
        storage = SecretTestStorage.getInstance(client, dataAdapter);
        expect(storage.client).eql(client);
        expect(storage.dataAdapter).instanceof(RawDataJSONAdapter);
        let newKeyResult = await storage.newKey();
        expect(newKeyResult.isFailure).to.equal(true);
    });

    it('load', async () => {
        let result;
        // result
        storage = SecretTestStorage.getInstance(client, dataAdapter);

        secretStub = sinon.stub(client);
        // stub SecretManager client method with expected response
        secretStub.getSecretValue.callsFake(success({SecretString: secretResponse}));

        result = await storage.load('secretName');
        expect(result.get()).eql(secretData);
        expect(client.getSecretValue.args[0][0]).eql({
            SecretId: "secretName"
        });

        // not found
        secretStub.getSecretValue.callsFake(fail(notFoundError));
        result = await storage.load('secretName');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('not found');
        expect(result.errors[0].source).equal('secrets manager');

        // fail
        secretStub.getSecretValue.callsFake(fail(new Error('error')));
        result = await storage.load('secretName');
        expect(result.isFailure).equal(true);
        expect(result.errors[0].message).equal('error');
        expect(result.errors[0].source).equal('secrets manager');
    });

    // TODO
    // it('save', async () => {
    //     let result;
    //
    //     // put success
    //     storage = newStorage(client, dataAdapter);
    //     client.putObject = sinon.spy(success({}));
    //     result = await storage.save(data, {key: '12214'});
    //     expect(result.get()).eql(data);
    //     expect(client.putObject.args[0][0]).eql({'ACL': 'private', 'Bucket': 'test', 'Key': '12214', 'Body': JSON.stringify(data)});
    //
    //     // fail
    //     client.putObject = sinon.spy(fail(new Error('error')));
    //     result = await storage.save(data);
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].message).equal('error');
    //     expect(result.errors[0].source).equal('s3');
    //
    // });
    //
    // it('erase', async () => {
    //     // result
    //     storage = newStorage(client, dataAdapter);
    //     client.deleteObject = sinon.spy(success({}));
    //     let result = await storage.erase('12214');
    //     expect(result.get()).eql(true);
    //     expect(client.deleteObject.args[0][0]).eql({'Bucket': 'test', 'Key': '12214'});
    //
    //     // not found
    //     client.deleteObject = sinon.spy(fail(notFoundError));
    //     result = await storage.erase('12214');
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].message).equal('not found');
    //     expect(result.errors[0].source).equal('s3');
    //
    //     // fail
    //     client.deleteObject = sinon.spy(fail(new Error('error')));
    //     result = await storage.erase('12214');
    //     expect(result.isFailure).equal(true);
    //     expect(result.errors[0].message).equal('error');
    //     expect(result.errors[0].source).equal('s3');
    // });

});

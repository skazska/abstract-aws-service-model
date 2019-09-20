import "mocha";
import {expect, use}  from 'chai';

// import {SecretsManager} from 'aws-sdk'
import {SecretTestStorage} from './storage';
import {SecretStorage} from '../../src/storage/secret'
import {config as awsConfig} from "aws-sdk/global";

import {RawDataJSONAdapter} from "../../src/storage/s3";

// const secretData = {
//     secret :'secret'
// };
//
// const secretResponse = JSON.stringify(secretData);

describe('secrets-storage', () => {
    let storage = null;
    let client = null;
    let dataAdapter = null;

    before(() => {
        awsConfig.loadFromPath('./test/.aws-cfg.json');
        client = SecretStorage.getDefaultClient();
        dataAdapter = new RawDataJSONAdapter();
    });

    it('load', async () => {
        storage = SecretTestStorage.getInstance(client, dataAdapter);

        let result = await storage.load('@-api-secrets');
        expect(result.isFailure).to.be.false;
        let data = result.get();
        expect(data).to.have.property('authApiSecret');
        expect(data).to.have.property('authPasswordSalt');

        // not found
        result = await storage.load('@-api-no-secrets');
        expect(result.isFailure).to.be.true;
        let error = result.errors[0];
        expect(error.message).eql('not found');
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

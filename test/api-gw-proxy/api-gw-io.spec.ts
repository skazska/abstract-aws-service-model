import "mocha";
import {expect, use}  from 'chai';
import {EventPayload} from './util/lambda';
import {AuthTest} from "./auth";
import {RegExIdentity} from "@skazska/abstract-service-model";
import {TestExecutable} from "./executable";
import {TestIO} from "./api-gw-io";
import {APIGatewayProxyResult} from "aws-lambda";


describe('api-gw-proxy', () => {
    let eventInput;
    let eventContext;
    let authenticator;
    let executable;
    let token;
    let instance;

    beforeEach(async () => {
        eventInput = new EventPayload(null, 'input');
        eventContext = new EventPayload(null, 'context');

        authenticator = new AuthTest(RegExIdentity.getInstance);
        token = (await authenticator.grant({test: 'read'}, 'testUser')).get();
        executable = new TestExecutable({
            accessObject: 'test',
            operation: 'read'
        });
        instance = new TestIO(executable, authenticator);

    });

    it('#handler returns APIGatewayProxyResult with success from executable', async () => {
        const event = eventInput.get(Object.assign({
            httpMethod: 'GET',
            headers: {'x-auth-token': token}
        }, {pathParameters: {login: 'client'}}));

        const context = eventContext.get({});

        // run handler
        const result :APIGatewayProxyResult = await instance.handler({event: event, context: context});

        expect(result).to.have.property('statusCode').eql(200);
        expect(result).to.have.property('body').eql('"tneilc"');
        expect(result).to.have.property('headers').eql({'Content-Type': 'application/json'});
    });

});


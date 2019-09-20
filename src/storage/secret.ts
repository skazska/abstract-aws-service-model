import {SecretsManager} from 'aws-sdk';
import {
    IStorageConfig,
    IStorage,
    GenericResult,
    failure,
    success,
    IStorageError,
    AbstractModelStorage,
    IStorageOperationOptions,
    storageError
} from '@skazska/abstract-service-model';
import {IRawDataAdapter, RawDataJSONAdapter} from './s3';
import {attachParams} from "./utils";
import {GetSecretValueRequest} from "aws-sdk/clients/secretsmanager";
import {message} from "aws-sdk/clients/sns";


export interface ISecretStorageConfig<D> extends IStorageConfig {
    client :SecretsManager;
    dataAdapter :IRawDataAdapter<D, string>;
}

export interface ISecretStorageGetOptions {
    versionId: string,
    versionStage: string
}

export class SecretStorage<D> implements IStorage<string, D> {
    readonly client :SecretsManager;
    readonly dataAdapter: IRawDataAdapter<D, string>;
    constructor(options :ISecretStorageConfig<D>) {
        this.client = options.client;
        this.dataAdapter = options.dataAdapter;
    }

    newKey(options?: IStorageOperationOptions): Promise<GenericResult<string, IStorageError>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    async load(secretName: string, options?: ISecretStorageGetOptions): Promise<GenericResult<D, IStorageError>> {
        let params :GetSecretValueRequest = attachParams({
            SecretId: secretName
        }, options);
        let data :SecretsManager.GetSecretValueResponse;

        try {
            data = await this.client.getSecretValue(params).promise();
        } catch (e) {
            return failure([ storageError(
                e.code === 'ResourceNotFoundException' ? 'not found' : (e.code || e.message),
                'secrets manager'
            ) ]);
        }

        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        let secretString :string;
        if ('SecretString' in data) {
            secretString = data.SecretString;
        } else {
            let buff = Buffer.from(<string>data.SecretBinary, 'base64');
            secretString = buff.toString('ascii');
        }

        try {
            return success(this.dataAdapter.deSerialize(secretString));
        } catch (e) {
            return failure([storageError(e.message, 'deserialize', e)])
        }

    }

    async save(data: D, options: IStorageOperationOptions): Promise<GenericResult<D, IStorageError>> {
        return Promise.resolve(failure([storageError('save is not supported', 'SecretStorage')]))
    }

    async erase(key: string, options?: IStorageOperationOptions): Promise<GenericResult<boolean, IStorageError>> {
        return Promise.resolve(failure([storageError('erase is not supported', 'SecretStorage')]))
    }

    static getDefaultClient(options? :SecretsManager.Types.ClientConfiguration) {
        return new SecretsManager(options);
    }


}

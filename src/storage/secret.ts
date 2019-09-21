/**
 * Module provides SecretStorage class and related interfaces to use as a base for storage in AWS SecretsManager
 */
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
import {IRawDataAdapter} from './s3';
import {attachParams} from "./utils";
import {GetSecretValueRequest} from "aws-sdk/clients/secretsmanager";

/** Secret storage constructor config */
export interface ISecretStorageConfig<D> extends IStorageConfig {
    /** AWS sdk Secrets Manager client */
    client :SecretsManager;
    /** data adapter to serialize/deserialize data in JSON string */
    dataAdapter :IRawDataAdapter<D, string>;
}

/** Secrets Manager getSecretValue specific options structure */
export interface ISecretStorageGetOptions {
    versionId: string,
    versionStage: string
}

/**
 * Implementation of IStorage to be used with AWS Secrets storage
 * @typeparam D - type of input/output data
 */
export class SecretStorage<D> implements IStorage<string, D> {
    /** AWS sdk Secrets Manager client */
    readonly client :SecretsManager;
    /** data adapter to serialize/deserialize data in JSON string */
    readonly dataAdapter: IRawDataAdapter<D, string>;

    constructor(options :ISecretStorageConfig<D>) {
        this.client = options.client;
        this.dataAdapter = options.dataAdapter;
    }

    /** not supported returns failure */
    newKey(options?: IStorageOperationOptions): Promise<GenericResult<string>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    /**
     * loads data from aws Secrets Manager by secretName
     * @param secretName
     * @param options - supported Secrets Manager getSecretValue options
     * @returns promise of @skazska/abstract-service-model.GenericResult
     */
    async load(secretName: string, options?: ISecretStorageGetOptions): Promise<GenericResult<D>> {
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

    /**
     * TODO
     * Saves data to aws Secrets Manager with name (not implemented yet)
     * @param data - data
     * @param options - supported Secrets Manager putSecret options
     * @returns promise of @skazska/abstract-service-model.GenericResult
     */
    async save(data: D, options: IStorageOperationOptions): Promise<GenericResult<D>> {
        return Promise.resolve(failure([storageError('save is not supported', 'SecretStorage')]))
    }

    /**
     * TODO
     * Removes data from aws Secrets Manager by name (not implemented yet)
     * @param secretName
     * @param options - supported Secrets Manager deleteSecret options
     * @returns promise of @skazska/abstract-service-model.GenericResult
     */
    async erase(secretName: string, options?: IStorageOperationOptions): Promise<GenericResult<boolean>> {
        return Promise.resolve(failure([storageError('erase is not supported', 'SecretStorage')]))
    }

    /**
     * returns default s3 Secrets Manager sdk client instance
     * @param options
     */
    static getDefaultClient(options? :SecretsManager.Types.ClientConfiguration) {
        return new SecretsManager(options);
    }


}

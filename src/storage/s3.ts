import {
    IStorage,
    IStorageConfig,
    IStorageError,
    IStorageOperationOptions,
    storageError,
    GenericResult,
    failure,
    AbstractModelStorage,
    success
} from "@skazska/abstract-service-model";

import {AWSError, DynamoDB, S3} from 'aws-sdk'
import {attachParams} from "./utils";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";


/**
 * Module provides S3Storage class and related interfaces to use as a base for crud storage for raw in
 * AWS S3
 */

/**
 * interface of raw data serialization adapter
 */
export interface IRawDataAdapter<D,S> {
    serialize: (data: D) => S;
    deSerialize: (data: S) => D;
}


/**
 * common s3 operation options
 */
export interface IS3StorageOperatorOptions extends IStorageOperationOptions {
}

/**
 * dynamodb get specific options
 */
export interface IS3StorageGetOptions extends IS3StorageOperatorOptions {
}

/**
 * dynamodb (put|update) specific options
 */
export interface IS3StorageSaveOptions extends IS3StorageOperatorOptions {
    key :string;
    ACL? :S3.Types.ObjectCannedACL;
}

/**
 * dynamodb (delete) specific options
 */
export interface IS3StorageDelOptions extends IS3StorageOperatorOptions {}


/**
 * constructor config
 */
export interface IS3StorageConfig<D, S> extends IStorageConfig {
    client :S3;
    dataAdapter: IRawDataAdapter<D, S>;
    bucket: string;
}

/**
 * generic raw sada s3 storage
 */
export class S3Storage<D, S> implements IStorage<string,D> {
    readonly client :S3;
    readonly bucket :string;
    readonly dataAdapter: IRawDataAdapter<D, S>;
    constructor(options :IS3StorageConfig<D, S>) {
        this.client = options.client;
        this.bucket = options.bucket;
        this.dataAdapter = options.dataAdapter;
    }

    newKey(options?: IStorageOperationOptions): Promise<GenericResult<string, IStorageError>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    async load(key: string, options?: IS3StorageGetOptions): Promise<GenericResult<D, IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            Key: key, /* required */
        }, options);

        let result;

        try {
            result = await this.client.getObject(<S3.Types.GetObjectRequest>params).promise();
        } catch (e) {
            const message = e.code === 'NoSuchKey' ? 'not found' : e.message;
            return failure([storageError(message, 's3', e)])
        }

        try {
            return success(this.dataAdapter.deSerialize(<S>result.Body));
        } catch (e) {
            return failure([storageError(e.message, 'deserialize', e)])
        }

    }

    async save(data: D, options: IS3StorageSaveOptions): Promise<GenericResult<D, IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            ACL: 'private',
            // Key: data[0], /* required should be provided in options*/
            Body: this.dataAdapter.serialize(data)
        }, options);

        try {
            await this.client.putObject(<S3.Types.PutObjectRequest>params).promise();
            return success(data);
        } catch (e) {
            return failure([storageError(e.message, 's3', e)]);
        }
    }

    async erase(key: string, options?: IS3StorageDelOptions): Promise<GenericResult<boolean, IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            Key: key /* required */
        }, options);

        try {
            await this.client.deleteObject(<S3.Types.DeleteObjectRequest>params).promise();
            return success(true);
        } catch (e) {
            const message = e.code === 'NoSuchKey' ? 'not found' : e.message;
            return failure([storageError(message, 's3', e)])
        }

    }

    // returns default storage client
    static getDefaultClient (options? :S3.Types.ClientConfiguration) :S3 {
        return new S3(options);
    }
}

/**
 * raw data to JSON serialization adapter
 */
export class RawDataJSONAdapter implements IRawDataAdapter<any, string> {
    serialize (data: any) :string {
        return JSON.stringify(data);
    };
    deSerialize (data: string) :any {
        return JSON.parse(data);
    };
}

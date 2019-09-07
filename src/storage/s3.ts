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

import {AWSError, S3} from 'aws-sdk'
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {attachParams} from "./utils";


/**
 * Module provides S3Storage class and related interfaces to use as a base for crud storage for raw in
 * AWS S3
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

export class S3Storage<K, D, S> implements IStorage<K,[K, D]> {
    readonly client :S3;
    readonly bucket :string;
    readonly dataAdapter: IRawDataAdapter<D, S>;
    constructor(options :IS3StorageConfig<D, S>) {
        this.client = options.client;
        this.bucket = options.bucket;
        this.dataAdapter = options.dataAdapter;
    }

    newKey(options?: IStorageOperationOptions): Promise<GenericResult<K, IStorageError>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    async load(key: K, options?: IS3StorageGetOptions): Promise<GenericResult<[K, D], IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            Key: key, /* required */
        }, options);

        let result;

        try {
            result = await this.client.getObject(<S3.Types.GetObjectRequest>params).promise();
            result = this.dataAdapter.deSerialize(result);
            return success([key, result]);
        } catch (e) {
            return failure([storageError(e)])
        }
    }

    async save(data: [K, D], options?: IS3StorageSaveOptions): Promise<GenericResult<[K, D], IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            ACL: 'private',
            Key: data[0], /* required */
            Body: this.dataAdapter.serialize(data[1])
        }, options);

        try {
            await this.client.putObject(<S3.Types.PutObjectRequest>params).promise();
            return success(data);
        } catch (e) {
            return failure([storageError(e)])
        }
    }

    async erase(key: K, options?: IS3StorageDelOptions): Promise<GenericResult<boolean, IStorageError>> {
        const params = attachParams({
            Bucket: this.bucket,
            Key: key /* required */
        }, options);

        try {
            await this.client.deleteObject(<S3.Types.DeleteObjectRequest>params).promise();
            return success(true);
        } catch (e) {
            return failure([storageError(e)])
        }
    }
}

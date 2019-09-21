/**
 * Module provides S3Storage class and related interfaces to use as a base for storage for raw in AWS S3
 */

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

import {S3} from 'aws-sdk'
import {attachParams} from "./utils";


/**
 * interface of raw data serialization adapter
 * @typeparam D - type of data to be serialize
 * @typeparam S - type of serialized data
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
 * s3 get specific options
 */
export interface IS3StorageGetOptions extends IS3StorageOperatorOptions {
}

/**
 * s3 (putObject) specific options
 */
export interface IS3StorageSaveOptions extends IS3StorageOperatorOptions {
    key :string;
    ACL? :S3.Types.ObjectCannedACL;
}

/**
 * s3 (deleteObject) specific options
 */
export interface IS3StorageDelOptions extends IS3StorageOperatorOptions {}


/**
 * constructor config
 * @typeparam D - type of data to input and output by storage
 * @typeparam S - type of data to be converted to in storage
 */
export interface IS3StorageConfig<D, S> extends IStorageConfig {
    /** AWS sdk S3 client instance */
    client :S3;
    /** data serialization adapter */
    dataAdapter: IRawDataAdapter<D, S>;
    /** s3 bucket */
    bucket: string;
}

/**
 * generic raw data s3 storage
 * @typeparam D - type of data to input and output by storage
 * @typeparam S - type of data to be converted to in storage
 */
export class S3Storage<D, S> implements IStorage<string,D> {
    /** AWS sdk S3 client instance */
    readonly client :S3;
    /** data serialization adapter */
    readonly dataAdapter: IRawDataAdapter<D, S>;
    /** s3 bucket */
    readonly bucket :string;

    constructor(options :IS3StorageConfig<D, S>) {
        this.client = options.client;
        this.bucket = options.bucket;
        this.dataAdapter = options.dataAdapter;
    }

    /**
     * no new key is implemented
     * @param options
     */
    newKey(options?: IStorageOperationOptions): Promise<GenericResult<string>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    /**
     * Loads data object from s3 bucket by key
     * @param key - object key
     * @param options - supported s3 getObject options
     * @returns promise of @skazska/abstract-service-model.GenericResult
     */
    async load(key: string, options?: IS3StorageGetOptions): Promise<GenericResult<D>> {
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

    /**
     * Saves data to object in s3 bucket with key
     * @param data - data
     * @param options - supported s3 putObject options
     * @returns promise of @skazska/abstract-service-model.GenericResult
     */
    async save(data: D, options: IS3StorageSaveOptions): Promise<GenericResult<D>> {
        const params = attachParams({
            Bucket: this.bucket,
            ACL: 'private',
            Body: this.dataAdapter.serialize(data)
        }, options);

        try {
            await this.client.putObject(<S3.Types.PutObjectRequest>params).promise();
            return success(data);
        } catch (e) {
            return failure([storageError(e.message, 's3', e)]);
        }
    }

    /**
     * Removes data object in s3 bucket by key
     * @param key - object key
     * @param options - supported s3 deleteObject options
     */
    async erase(key: string, options?: IS3StorageDelOptions): Promise<GenericResult<boolean>> {
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

    /**
     * returns default storage client
     */
    static getDefaultClient (options? :S3.Types.ClientConfiguration) :S3 {
        return new S3(options);
    }
}

/**
 * raw data to JSON serialization/deserialization adapter
 */
export class RawDataJSONAdapter implements IRawDataAdapter<any, string> {
    /** converts JS data to JSON */
    serialize (data: any) :string {
        return JSON.stringify(data);
    };
    /** converts JSON to JS data */
    deSerialize (data: string) :any {
        return JSON.parse(data);
    };
}

import {S3Storage} from "../../src/storage/s3";

export interface IData {
    key: string
}

export class S3TestStorage extends S3Storage<IData[], string> {

}

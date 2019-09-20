import {SecretStorage} from "../../src/storage/secret";
import {SecretsManager} from "aws-sdk";
import {IRawDataAdapter, RawDataJSONAdapter} from "../../src";

export interface IData {
    secret: string
}

export class SecretTestStorage extends SecretStorage<IData> {

    static getInstance(
        client? :SecretsManager|null,
        dataAdapter?: IRawDataAdapter<IData, string>|null
    ) {
        return new SecretStorage<IData>({
            client :client || SecretStorage.getDefaultClient(),
            dataAdapter: dataAdapter || new RawDataJSONAdapter()
        });
    }

}

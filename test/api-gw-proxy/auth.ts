import {AbstractAuth, IAuthData, IAccessDetails, IAuthError, failure, success, GenericResult} from "@skazska/abstract-service-model";

export class AuthTest extends AbstractAuth {
    _data: IAuthData;
    _realms: string[];

    constructor (identityConstructor, options?) {
        super(identityConstructor, options);
    }

    protected verify(secret: any, token :string, realm? :string) :Promise<GenericResult<IAuthData>> {
        let result :GenericResult<IAuthData>;
        if (token === 'right' ) {
            result = success(this._data);
        } else {
            result = failure([AbstractAuth.error('bad tokens', 'any', realm)]);
        }
        return Promise.resolve(result);
    };

    grant(details: IAccessDetails, subject: string, realms?: string[]): Promise<GenericResult<string>> {
        this._data = {details: details, subject: subject, realms: realms};
        this._realms = realms;
        return Promise.resolve(success('right'));
    }
}

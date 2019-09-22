import {AbstractAuth, IAuthData, IAccessDetails, IAuthError, failure, success, GenericResult} from "@skazska/abstract-service-model";

export class AuthTest extends AbstractAuth {
    _data: IAuthData;

    constructor (identityConstructor, options?) {
        super(identityConstructor, options);
    }

    protected verify(secret: any, token :string, options?) :Promise<GenericResult<IAuthData>> {
        let result :GenericResult<IAuthData>;
        if (token === 'right' ) {
            result = success(this._data);
        } else {
            result = failure([AbstractAuth.error('bad tokens', 'any')]);
        }
        return Promise.resolve(result);
    };

    grant(details: IAccessDetails, subject: string, options?): Promise<GenericResult<string>> {
        this._data = {details: details, subject: subject};
        return Promise.resolve(success('right'));
    }
}

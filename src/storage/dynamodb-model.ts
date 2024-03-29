/**
 * Module provides DynamodbModelStorage class and related interfaces to use as a base for crud storage for model in
 * AWS DynamoDB
 */
import {
    AbstractModelStorage,
    IModelStorageConfig,
    GenericModel,
    failure,
    GenericResult,
    success,
    IStorageError,
    IStorageOperationOptions
} from "@skazska/abstract-service-model";

import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import {DynamoDB} from "aws-sdk";
import {attachParams} from "./utils";

/**
 * DynamodbModelStorage constructor config
 */
export interface IDynamodbModelStorageConfig<K, P> extends IModelStorageConfig<K,P> {
    /** AWS sdk dynamodb document client */
    client :DocumentClient;
    /** table name */
    table: string;
}

/**
 * common dynamodb operation options
 */
export interface IDynamodbStorageOperatorOptions extends IStorageOperationOptions {
    returnConsumedCapacity?: DocumentClient.ReturnConsumedCapacity;
    /**
     * One or more substitution tokens for attribute names in an expression. The following are some use cases for using ExpressionAttributeNames:   To access an attribute whose name conflicts with a DynamoDB reserved word.   To create a placeholder for repeating occurrences of an attribute name in an expression.   To prevent special characters in an attribute name from being misinterpreted in an expression.   Use the # character in an expression to dereference an attribute name. For example, consider the following attribute name:    Percentile    The name of this attribute conflicts with a reserved word, so it cannot be used directly in an expression. (For the complete list of reserved words, see Reserved Words in the Amazon DynamoDB Developer Guide). To work around this, you could specify the following for ExpressionAttributeNames:    {"#P":"Percentile"}    You could then use this substitution in an expression, as in this example:    #P = :val     Tokens that begin with the : character are expression attribute values, which are placeholders for the actual value at runtime.  For more information on expression attribute names, see Specifying Item Attributes in the Amazon DynamoDB Developer Guide.
     */
    expressionAttributeNames? :DocumentClient.ExpressionAttributeNameMap;
}

/**
 * dynamodb get specific options
 */
export interface IDynamodbStorageGetOptions extends IDynamodbStorageOperatorOptions {
    /**
     * Determines the read consistency model: If set to true, then the operation uses strongly consistent reads; otherwise, the operation uses eventually consistent reads.
     */
    consistentRead? :DocumentClient.ConsistentRead;
    /**
     * A string that identifies one or more attributes to retrieve from the table. These attributes can include scalars, sets, or elements of a JSON document. The attributes in the expression must be separated by commas. If no attribute names are specified, then all attributes are returned. If any of the requested attributes are not found, they do not appear in the result. For more information, see Specifying Item Attributes in the Amazon DynamoDB Developer Guide.
     */
    projectionExpression? :DocumentClient.ProjectionExpression;
}

/**
 * dynamodb (put|update|delete) specific options
 */
interface IDynamodbStorageModifyOptions extends IDynamodbStorageOperatorOptions {
    /**
     * Use ReturnValues if you want to get the item attributes as they appeared before they were updated with the PutItem request. For PutItem, the valid values are:    NONE - If ReturnValues is not specified, or if its value is NONE, then nothing is returned. (This setting is the default for ReturnValues.)    ALL_OLD - If PutItem overwrote an attribute name-value pair, then the content of the old item is returned.    The ReturnValues parameter is used by several DynamoDB operations; however, PutItem does not recognize any values other than NONE or ALL_OLD.
     */
    returnValues?: DocumentClient.ReturnValue;
    /**
     * Determines whether item collection metrics are returned. If set to SIZE, the response includes statistics about item collections, if any, that were modified during the operation are returned in the response. If set to NONE (the default), no statistics are returned.
     */
    returnItemCollectionMetrics?: DocumentClient.ReturnItemCollectionMetrics;
    /**
     * A condition that must be satisfied in order for a conditional PutItem operation to succeed. An expression can contain any of the following:   Functions: attribute_exists | attribute_not_exists | attribute_type | contains | begins_with | size  These function names are case-sensitive.   Comparison operators: = | &lt;&gt; | &lt; | &gt; | &lt;= | &gt;= | BETWEEN | IN      Logical operators: AND | OR | NOT    For more information on condition expressions, see Condition Expressions in the Amazon DynamoDB Developer Guide.
     */
    conditionExpression?: DocumentClient.ConditionExpression;
    /**
     * One or more substitution tokens for attribute names in an expression. The following are some use cases for using ExpressionAttributeNames:   To access an attribute whose name conflicts with a DynamoDB reserved word.   To create a placeholder for repeating occurrences of an attribute name in an expression.   To prevent special characters in an attribute name from being misinterpreted in an expression.   Use the # character in an expression to dereference an attribute name. For example, consider the following attribute name:    Percentile    The name of this attribute conflicts with a reserved word, so it cannot be used directly in an expression. (For the complete list of reserved words, see Reserved Words in the Amazon DynamoDB Developer Guide). To work around this, you could specify the following for ExpressionAttributeNames:    {"#P":"Percentile"}    You could then use this substitution in an expression, as in this example:    #P = :val     Tokens that begin with the : character are expression attribute values, which are placeholders for the actual value at runtime.  For more information on expression attribute names, see Specifying Item Attributes in the Amazon DynamoDB Developer Guide.
     */
    expressionAttributeNames?: DocumentClient.ExpressionAttributeNameMap;
    /**
     * One or more values that can be substituted in an expression. Use the : (colon) character in an expression to dereference an attribute value. For example, suppose that you wanted to check whether the value of the ProductStatus attribute was one of the following:   Available | Backordered | Discontinued  You would first need to specify ExpressionAttributeValues as follows:  { ":avail":{"S":"Available"}, ":back":{"S":"Backordered"}, ":disc":{"S":"Discontinued"} }  You could then use these values in an expression, such as this:  ProductStatus IN (:avail, :back, :disc)  For more information on expression attribute values, see Condition Expressions in the Amazon DynamoDB Developer Guide.
     */
    expressionAttributeValues?: DocumentClient.ExpressionAttributeValueMap;
}

/**
 * dynamodb (put|update) specific options
 */
export interface IDynamodbStorageSaveOptions extends IDynamodbStorageModifyOptions {
    /**
     * An expression that defines one or more attributes to be updated, the action to be performed on them, and new values for them. The following action values are available for UpdateExpression.    SET - Adds one or more attributes and values to an item. If any of these attributes already exist, they are replaced by the new values. You can also use SET to add or subtract from an attribute that is of type Number. For example: SET myNum = myNum + :val   SET supports the following functions:    if_not_exists (path, operand) - if the item does not contain an attribute at the specified path, then if_not_exists evaluates to operand; otherwise, it evaluates to path. You can use this function to avoid overwriting an attribute that may already be present in the item.    list_append (operand, operand) - evaluates to a list with a new element added to it. You can append the new element to the start or the end of the list by reversing the order of the operands.   These function names are case-sensitive.    REMOVE - Removes one or more attributes from an item.    ADD - Adds the specified value to the item, if the attribute does not already exist. If the attribute does exist, then the behavior of ADD depends on the data type of the attribute:   If the existing attribute is a number, and if Value is also a number, then Value is mathematically added to the existing attribute. If Value is a negative number, then it is subtracted from the existing attribute.  If you use ADD to increment or decrement a number value for an item that doesn't exist before the update, DynamoDB uses 0 as the initial value. Similarly, if you use ADD for an existing item to increment or decrement an attribute value that doesn't exist before the update, DynamoDB uses 0 as the initial value. For example, suppose that the item you want to update doesn't have an attribute named itemcount, but you decide to ADD the number 3 to this attribute anyway. DynamoDB will create the itemcount attribute, set its initial value to 0, and finally add 3 to it. The result will be a new itemcount attribute in the item, with a value of 3.    If the existing data type is a set and if Value is also a set, then Value is added to the existing set. For example, if the attribute value is the set [1,2], and the ADD action specified [3], then the final attribute value is [1,2,3]. An error occurs if an ADD action is specified for a set attribute and the attribute type specified does not match the existing set type.  Both sets must have the same primitive data type. For example, if the existing data type is a set of strings, the Value must also be a set of strings.    The ADD action only supports Number and set data types. In addition, ADD can only be used on top-level attributes, not nested attributes.     DELETE - Deletes an element from a set. If a set of values is specified, then those values are subtracted from the old set. For example, if the attribute value was the set [a,b,c] and the DELETE action specifies [a,c], then the final attribute value is [b]. Specifying an empty set is an error.  The DELETE action only supports set data types. In addition, DELETE can only be used on top-level attributes, not nested attributes.    You can have many actions in a single expression, such as the following: SET a=:value1, b=:value2 DELETE :value3, :value4, :value5  For more information on update expressions, see Modifying Items and Attributes in the Amazon DynamoDB Developer Guide.
     */
    updateExpression?: DocumentClient.UpdateExpression;
}

/**
 * dynamodb (delete) specific options
 */
export interface IDynamodbStorageDelOptions extends IDynamodbStorageModifyOptions {}


/**
 * converts Object data to DocumentClient.Key
 * @param obj - object with keys
 */
const objectToKey = (obj :any) :DocumentClient.Key => {
    //TODO there possibly some transformations may be required
    return <DocumentClient.Key>obj;
};

/**
 * converts Object data to DocumentClient.AttributeMap
 * @param obj - attributes
 */
const objectToAttributeMap = (obj :any) :DocumentClient.AttributeMap => {
    //TODO there possibly some transformations may be required
    return <DocumentClient.AttributeMap>obj;
};

/**
 * Dynamodb Model Storage
 * @typeparam K - key structure
 * @typeparam P - properties structure
 */
export class DynamodbModelStorage<K, P> extends AbstractModelStorage<K,P> {
    /** AWS sdk dynamodb document client */
    readonly client :DocumentClient;
    /** table name */
    readonly table: string;

    /**
     * constructor
     * @param props - Dynamodb Model Storage Config
     */
    constructor(props :IDynamodbModelStorageConfig<K,P>) {
        super(props);
        this.client = props.client;
        this.table = props.table
    }

    /**
     * allows to implement custom processing of put|update before return
     * @param model
     * @param response
     */
    protected processModifyResult(
        model :GenericModel<K,P>,
        response :DocumentClient.UpdateItemOutput|DocumentClient.PutItemOutput) :GenericResult<GenericModel<K,P>, IStorageError>
    {
        return success(model);
    }

    /**
     * allows to get id for new entity (not implemented, returns failure)
     * @param options
     */
    newKey(options?: IStorageOperationOptions): Promise<GenericResult<K, IStorageError>> {
        return Promise.resolve(failure([AbstractModelStorage.error('use natural key')]));
    }

    /**
     * loads and returns entity model from storage
     * @param key - key
     * @param options - dynamodb options for get
     * @return @skazska/abstract-service-model.GenericResult of @skazska/abstract-service-model.GenericModel<K,P>
     *     representing record retrieved
     */
    load(key :K, options?: IDynamodbStorageGetOptions) :Promise<GenericResult<GenericModel<K,P>, IStorageError>> {
        return new Promise((resolve) => {
            const params = attachParams({
                TableName: this.table,
                Key: objectToKey(key)
            }, options);
            this.client.get(<DocumentClient.GetItemInput>params, (err, data) => {
                if (err) return resolve(failure([AbstractModelStorage.error(err.message, 'dynamodb', err)]));
                if (!data.Item) return resolve(failure([AbstractModelStorage.error('not found', 'dynamodb')]));
                resolve(this.modelFactory.dataModel(data.Item));
            });
        });
    }

    /**
     * saves model to storage, returns model
     * @param data - model
     * @param options - dynamodb options for (put|update)
     * @returns data itself
     */
    save(data :GenericModel<K,P>, options?: IDynamodbStorageSaveOptions)
        :Promise<GenericResult<GenericModel<K,P>, IStorageError>> {

        return new Promise((resolve) => {
            if (options && options.updateExpression) {
                // update
                let params = attachParams({
                    TableName: this.table,
                    Key: objectToKey(data.getKey())
                }, options);
                this.client.update(<DocumentClient.UpdateItemInput>params, (err, response) => {
                    if (err) return resolve(failure([AbstractModelStorage.error(err.message, 'dynamodb')]));
                    resolve(this.processModifyResult(data, response));
                });
            } else {
                // put
                let dataResult = this.modelFactory.data(data);
                if (dataResult.isFailure)
                    return resolve(failure([AbstractModelStorage.error('model to Item convert error')]));

                let params = attachParams({
                    TableName: this.table,
                    Item: objectToAttributeMap(dataResult.get())
                }, options);
                this.client.put(<DocumentClient.PutItemInput>params, (err, response) => {
                    if (err) return resolve(failure([AbstractModelStorage.error(err.message, 'dynamodb')]));
                    resolve(this.processModifyResult(data, response));
                });
            }
        });
    }

    /**
     * removes entity from storage
     * @param key - key
     * @param options - dynamodb del options
     */
    erase(key :K, options? :IDynamodbStorageDelOptions):Promise<GenericResult<boolean, IStorageError>> {
        return new Promise((resolve) => {
            const params = attachParams({
                TableName: this.table,
                Key: objectToKey(key)
            }, options);
            this.client.delete(<DocumentClient.DeleteItemInput>params, (err, data) => {
                if (err) return resolve(failure([AbstractModelStorage.error(err.message, 'dynamodb')]));
                resolve(success(true));
            });
        });
    }

    // returns default storage client
    static getDefaultClient (options? :DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration) :DocumentClient {
        return new DynamoDB.DocumentClient(options);
    }
}

import _dynamoDBStorageHandler from './entity/dynamodb-storage-handler'
export { _dynamoDBStorageHandler as DynamoDBStorageHandler };

import _dynamoDBStorageBackend from './storage/dynamodb-storage'
export { _dynamoDBStorageBackend as DynamoDBStorageBackend };

export default _dynamoDBStorageBackend;
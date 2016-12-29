'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DynamoDBStorageBackend = exports.DynamoDBStorageHandler = undefined;

var _dynamodbStorageHandler = require('./entity/dynamodb-storage-handler');

var _dynamodbStorageHandler2 = _interopRequireDefault(_dynamodbStorageHandler);

var _dynamodbStorage = require('./storage/dynamodb-storage');

var _dynamodbStorage2 = _interopRequireDefault(_dynamodbStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.DynamoDBStorageHandler = _dynamodbStorageHandler2.default;
exports.DynamoDBStorageBackend = _dynamodbStorage2.default;
exports.default = _dynamodbStorage2.default;
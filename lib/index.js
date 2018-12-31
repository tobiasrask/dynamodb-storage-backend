"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "DynamoDBStorageHandler", {
  enumerable: true,
  get: function get() {
    return _dynamodbStorageHandler.default;
  }
});
Object.defineProperty(exports, "DynamoDBStorageBackend", {
  enumerable: true,
  get: function get() {
    return _dynamodbStorage.default;
  }
});
exports.default = void 0;

var _dynamodbStorageHandler = _interopRequireDefault(require("./entity/dynamodb-storage-handler"));

var _dynamodbStorage = _interopRequireDefault(require("./storage/dynamodb-storage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _default = _dynamodbStorage.default;
exports.default = _default;
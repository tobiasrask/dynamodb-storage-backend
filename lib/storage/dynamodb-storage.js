'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _domainMap = require('domain-map');

var _domainMap2 = _interopRequireDefault(_domainMap);

var _entityApi = require('entity-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
* Simple memory storage backend.
*/
var DynamoDBStorageBackend = function (_StorageBackend) {
  _inherits(DynamoDBStorageBackend, _StorageBackend);

  /**
  * Construct
  *
  * @param variables with following keys:
  *   storageHandler
  *     Storage handler who is using storage backend.
  *   dynamodb
  *     Dynamodb instance configued by client:
  *     http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
  */
  function DynamoDBStorageBackend() {
    var variables = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, DynamoDBStorageBackend);

    var _this = _possibleConstructorReturn(this, (DynamoDBStorageBackend.__proto__ || Object.getPrototypeOf(DynamoDBStorageBackend)).call(this, variables));

    if (variables.hasOwnProperty('lockUpdates')) _this.setStorageLock(variables.lockUpdates);

    // Apply dynamodb endpoint
    if (!variables.hasOwnProperty('dynamodb')) throw new Error("DynamoDB instance must be provided");

    _this._registry.set("properties", 'dynamodb', variables.dynamodb);
    return _this;
  }

  /**
  * Load entity content container for entity data. DynamoDB supports only
  * fetching items in batches size of 100 items.
  *
  * @param ids
  *   Array of entity ids.
  * @param callback
  *   Passes map of objects keyed with existing entity id. If entity doesn't
  *   exists, it will not be indexed.
  */


  _createClass(DynamoDBStorageBackend, [{
    key: 'loadEntityContainers',
    value: function loadEntityContainers(ids, callback) {
      var self = this;
      var result = _domainMap2.default.createCollection({ strictKeyMode: false });

      var pointer = 0;
      var maxItems = 100;
      var tableName = this.getEntityTableName();
      var countBatches = Math.ceil(ids.length / maxItems);

      var dynamodb = this._registry.get("properties", 'dynamodb');

      // Load batch data
      function loadBatchData(keys) {
        var params = { RequestItems: {} };
        params.RequestItems[tableName] = {
          Keys: keys
        };

        dynamodb.batchGetItem(params, function (err, data) {
          if (err) return callback(err);

          // Process data
          Object.keys(data.Responses).forEach(function (table) {
            Object.keys(data.Responses[table]).forEach(function (row) {
              var rowData = self.processDynamoDBResponse(row);
              // TODO: Get entity id dynamically...
              var entityId = rowData;
              result.set(entityId, rowData);
            });
          });

          self.getBatch();
        });
      }

      // Fetch batch
      // TODO: Support dynamical keys names
      // TODO: Support throttling
      function getBatch() {
        var keys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        if (ids.length == ids.length) return callback(null, result);

        while (pointer < ids.length && keys.length < maxItems) {
          keys.push({
            entity_id: {
              S: ids[i]
            }
          });
          pointer++;
        }
      }
    }

    /**
    * Process dynamodb response object.
    *
    * @param row
    * @return data
    */

  }, {
    key: 'processDynamoDBResponse',
    value: function processDynamoDBResponse(row) {}

    /**
    * Save entity content container.
    *
    * @param entityId
    *   Entity id
    * @param container
    *   Container data
    * @param caallback
    */

  }, {
    key: 'saveEntityContainer',
    value: function saveEntityContainer(entityId, container, callback) {
      if (this.isStorageLocked()) return callback(new Error("Storage updates are locked"));

      var domain = this.getStorageDomain();
      this._registry.set(domain, entityId, container);
      callback(null);
    }

    /**
    * Return storege domain.
    *
    * @return storage domain
    */

  }, {
    key: 'getEntityTableName',
    value: function getEntityTableName() {
      return this.getStorageHandler().getStorageTableName();
    }

    /**
    * Encode json object to DynamoDB map data structure.
    *
    * @param data
    * @return object
    */

  }, {
    key: 'encodeMap',
    value: function encodeMap(data) {
      var self = this;
      var result = null;
      var build = {};

      if (data == null) return build;

      if (Array.isArray(data)) {
        build = [];
        for (var _i = 0; _i < data.length; _i++) {
          result = this.encodeMapValues(data[_i]);
          if (result != null) build.push(result);
        }
      } else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
        Object.keys(data).forEach(function (key, index) {
          result = this.encodeMapValues(data[key]);
          if (result != null) build[key] = result;
        });
      } else {
        result = this.encodeMapValues(data);
        if (result != null) build = result;
      }
      return build;
    }

    /**
    * Encode map values.
    *
    * @param value
    * @return data
    */

  }, {
    key: 'encodeMapValues',
    value: function encodeMapValues(value) {
      var result = null;

      if (value == null) return result;

      if (Array.isArray(value)) {
        result = { 'L': this.encodeMap(value) };
      } else if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
        result = { 'M': this.encodeMap(value) };
      } else {
        var dynamoType = this.getDynamoType(value, 'valueType');
        if (dynamoType == "BOOL") {
          result = {
            'BOOL': value ? true : false
          };
        } else if (dynamoType == "NULL") {
          result = {
            'NULL': value == null ? true : false
          };
        } else {
          var tmp = value.toString();
          if (tmp != null && tmp.length > 0) {
            result = {};
            result[dynamoType] = tmp;
          }
        }
      }
      return result;
    }

    /**
    * Decode json object to DynamoDB map data structure.
    *
    * @param data
    * @return object
    */

  }, {
    key: 'decodeMap',
    value: function decodeMap(data) {
      var self = this;
      var build = null;

      if (data == null) return build;

      if (Array.isArray(data)) {
        build = [];
        data.map(function (value) {
          build.push(self.decodeMap(value));
        });
      } else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
        build = {};
        Object.keys(data).forEach(function (key, index) {
          if (key == 'M' || key == 'L') {
            build = self.decodeMap(data[key]);
          } else if (key == 'S') {
            build = data[key];
          } else if (key == 'N') {
            build = Number(data[key]);
          } else if (key == 'BOOL') {
            build = Boolean(data[key]);
          } else if (key == 'NULL') {
            build = data[key] ? null : null;
          } else {
            build[key] = self.decodeMap(data[key]);
          }
        });
      } else {
        build = data;
      }
      return build;
    }

    /**
    * Method returns dynamo type for primitive data types
    * or javascript ovalues.
    *
    * @param value
    *   Primitive data type name or value, based on scope
    * @param type
    *   Possible values are "primitiveType" (default) or "valueType"
    *
    * @return dynamo type or false if match not found
    */

  }, {
    key: 'getDynamoType',
    value: function getDynamoType(value) {
      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "primitiveType";

      var dynamoType = false;
      var DynamoTypeMap = {
        'string': 'S',
        'number': 'N',
        'boolean': 'BOOL',
        'null': 'NULL',
        'array': 'L',
        'object': 'M'
      };
      var primitiveMap = {
        'integer': 'number',
        'text': 'string',
        'text_map': 'object',
        'text_list': 'array',
        'image': 'array'
      };

      if (type == "primitiveType" && primitiveMap.hasOwnProperty(value)) {
        dynamoType = primitiveMap[value];
      } else if (type == "valueType") {
        dynamoType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
      }

      return dynamoType && DynamoTypeMap.hasOwnProperty(dynamoType) ? DynamoTypeMap[dynamoType] : false;
    }
  }]);

  return DynamoDBStorageBackend;
}(_entityApi.StorageBackend);

exports.default = DynamoDBStorageBackend;
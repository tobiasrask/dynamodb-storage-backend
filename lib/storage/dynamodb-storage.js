'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _domainMap = require('domain-map');

var _domainMap2 = _interopRequireDefault(_domainMap);

var _entityApi = require('entity-api');

var _entityApi2 = _interopRequireDefault(_entityApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// TODO:
// Table status, install, update, uninstall
// Entity CRUDi operations

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
  * TODO: Support throttling
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
      var tableName = this.getStorageTableName();
      var countBatches = Math.ceil(ids.length / maxItems);
      var dynamodb = this._registry.get("properties", 'dynamodb');
      var indexeDefinitions = this.getStorageIndexDefinitions();

      function loadBatchData(keys) {
        var params = { RequestItems: {} };
        params.RequestItems[tableName] = {
          Keys: keys
        };

        dynamodb.batchGetItem(params, function (err, data) {
          if (err) return callback(err);

          // Process data
          Object.keys(data.Responses).forEach(function (tableName) {
            // Do not process empty reponses;
            if (!Array.isArray(data.Responses[tableName])) return;

            data.Responses[tableName].forEach(function (rowData) {
              var data = self.decodeMap(rowData);
              // TODO: Get entity id dynamically...
              var entityId = self.getStorageHandler().extractEntityId(indexeDefinitions, data);
              result.set(entityId, data);
            });
          });

          getBatch();
        });
      }

      function getBatch() {
        if (pointer == ids.length) return callback(null, result);

        var keys = [];
        while (pointer < ids.length && keys.length < maxItems) {
          keys.push({
            entity_id: {
              S: ids[pointer]
            }
          });
          pointer++;
        }
        loadBatchData(keys);
      }

      getBatch();
    }

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
    key: 'getStorageTableName',
    value: function getStorageTableName() {
      return this.getStorageHandler().getStorageTableName();
    }

    /**
    * Return storege domain.
    *
    * @return storage domain
    */

  }, {
    key: 'getStorageIndexDefinitions',
    value: function getStorageIndexDefinitions() {
      return this.getStorageHandler().getStorageIndexDefinitions();
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
        for (var i = 0; i < data.length; i++) {
          result = self.encodeMapValues(data[i]);
          if (result != null) build.push(result);
        }
      } else if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
        Object.keys(data).forEach(function (key, index) {
          result = self.encodeMapValues(data[key]);
          if (result != null) build[key] = result;
        });
      } else {
        result = self.encodeMapValues(data);
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
    * Select data from storage.
    *
    * @param variables
    * @param callback
    */

  }, {
    key: 'select',
    value: function select(variables, callback) {
      var self = this;
      var query = this.buildSelectQuery(variables);
      self.executeSelectQuery(variables, query, function (err, result) {
        if (err) callback(err);else callback(null, result);
      });
    }

    /**
    * Build select parameters
    *
    * @param variables with following keys
    *   - query
    * @return params
    */

  }, {
    key: 'buildSelectQuery',
    value: function buildSelectQuery(variables) {
      var self = this;

      var query = variables.hasOwnProperty('query') ? variables.query : {};

      // Fill basic values
      if (!query.hasOwnProperty('TableName')) query.TableName = this.getStorageTableName();

      return query;
    }

    /**
    * Execute query
    *
    * @param variables
    * @param query
    * @param callback
    */

  }, {
    key: 'executeSelectQuery',
    value: function executeSelectQuery(variables, query, callback) {
      var self = this;

      var dynamodb = this._registry.get("properties", 'dynamodb');

      var resultHandler = function resultHandler(err, data) {
        if (err) return callback(err);

        callback(null, data);
      };

      if (variables.method == 'scan') {
        dynamodb.scan(query, resultHandler);
      } else if (variables.method == 'query') {
        dynamodb.query(query, resultHandler);
      } else {
        callback(new Error('Unknown method: ' + variables.method));
      }
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

    /**
    * Returns list of DynamoDB tabls installed.
    *
    * @param callback
    */

  }, {
    key: 'getDynamoDBTables',
    value: function getDynamoDBTables(callback) {
      var dynamodb = this._registry.get("properties", 'dynamodb');
      dynamodb.listTables({}, function (err, data) {
        if (err) callback(err);else callback(null, data);
      });
    }

    /**
    * Method checks if given table exists.
    *
    * @param tableName
    * @param callback
    */

  }, {
    key: 'checkStorageTableStatus',
    value: function checkStorageTableStatus(tableName, callback) {
      this.getDynamoDBTables(function (err, result) {
        if (err) return callback(err);else if (result.TableNames.find(function (item) {
          return item == tableName;
        })) callback(null, true);else callback(null, false);
      });
    }

    /**
    * Install schema
    *
    * @param scema
    *   Install one or more schemas
    * @param options
    * @param callback
    */

  }, {
    key: 'installSchemas',
    value: function installSchemas(schemas, options, callback) {
      var self = this;
      var counter = schemas.length;
      var errors = false;

      if (!counter) return callback(null);

      schemas.forEach(function (schema) {
        _entityApi2.default.log("DynamoDBStorageBackend", 'Creating table: ' + schema.TableName);

        self.installSchema(schema, options, function (err, succeed) {
          if (err) {
            _entityApi2.default.log("DynamoDBStorageBackend", err.toString(), 'error');
            errors = true;
          } else if (succeed) {
            _entityApi2.default.log("DynamoDBStorageBackend", 'Table created: ' + schema.TableName);
          } else {
            _entityApi2.default.log("DynamoDBStorageBackend", 'Table not created, already exists: ' + schema.TableName);
          }

          counter--;
          if (counter > 0) return;else if (errors) callback(new Error("There was an error when installing schemas."));else callback(null);
        });
      });
    }

    /**
    * Install schema.
    *
    * @param schema
    * @param options
    * @param callback
    *   Provides errors and creation status
    */

  }, {
    key: 'installSchema',
    value: function installSchema(schema, options, callback) {
      var _this2 = this;

      if (!schema.hasOwnProperty('TableName')) return callback(new Error("Missing required 'TableName' field"));

      this.checkStorageTableStatus(schema.TableName, function (err, tableExists) {
        if (err) return callback(err);

        // Skip table creation if table already exists
        if (tableExists) return callback(null, false);

        var dynamodb = _this2._registry.get("properties", 'dynamodb');

        dynamodb.createTable(schema, function (err, data) {
          if (err) callback(err);else callback(null, true);
        });
      });
    }

    /**
    * Update schema
    *
    * @param scema
    *   Install one or more schemas
    * @param options
    * @param callback
    */

  }, {
    key: 'updateSchemas',
    value: function updateSchemas(schemas, options, callback) {
      callback(null);
    }

    /**
    * Uninstall schema
    *
    * @param scema
    *   Install one or more schemas
    * @param options
    * @param callback
    */

  }, {
    key: 'uninstallSchemas',
    value: function uninstallSchemas(schemas, options, callback) {
      var self = this;
      var counter = schemas.length;
      var errors = false;

      if (!counter) return callback(null);

      schemas.forEach(function (schema) {
        _entityApi2.default.log("DynamoDBStorageBackend", 'Deleting table: ' + schema.TableName);

        self.uninstallSchema(schema, options, function (err, succeed) {
          if (err) {
            _entityApi2.default.log("DynamoDBStorageBackend", err.toString(), 'error');
            errors = true;
          } else if (succeed) {
            _entityApi2.default.log("DynamoDBStorageBackend", 'Table deleted: ' + schema.TableName);
          } else {
            _entityApi2.default.log("DynamoDBStorageBackend", 'Table not deleted, might be it didn\'t exists: ' + schema.TableName);
          }

          counter--;
          if (counter > 0) return;else if (errors) callback(new Error("There was an error when uninstalling schemas."));else callback(null);
        });
      });
    }

    /**
    * Uninstall schema.
    *
    * @param schema
    * @param options
    * @param callback
    *   Provides errors and creation status
    */

  }, {
    key: 'uninstallSchema',
    value: function uninstallSchema(schema, options, callback) {
      var _this3 = this;

      if (!schema.hasOwnProperty('TableName')) return callback(new Error("Missing required 'TableName' field"));

      this.checkStorageTableStatus(schema.TableName, function (err, tableExists) {
        if (err) return callback(err);

        // Skip table deletion if it doesn't exists
        if (!tableExists) return callback(null, false);

        var dynamodb = _this3._registry.get("properties", 'dynamodb');

        dynamodb.deleteTable({ TableName: schema.TableName }, function (err, data) {
          if (err) callback(err);else callback(null, true);
        });
      });
    }
  }]);

  return DynamoDBStorageBackend;
}(_entityApi.StorageBackend);

exports.default = DynamoDBStorageBackend;
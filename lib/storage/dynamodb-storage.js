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
var DDBStorageBackend = function (_StorageBackend) {
  _inherits(DDBStorageBackend, _StorageBackend);

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
  function DDBStorageBackend() {
    var variables = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, DDBStorageBackend);

    var _this = _possibleConstructorReturn(this, (DDBStorageBackend.__proto__ || Object.getPrototypeOf(DDBStorageBackend)).call(this, variables));

    if (variables.hasOwnProperty('lockUpdates')) _this.setStorageLock(variables.lockUpdates);

    if (!variables.hasOwnProperty('dynamodb')) throw new Error("DynamoDB instance must be provided");

    _this._registry.set("properties", 'dynamodb', variables.dynamodb);
    return _this;
  }

  /**
  * Returns assigned DynamoDB Instance.
  *
  * @return instance
  */


  _createClass(DDBStorageBackend, [{
    key: 'getDynamoDBInstance',
    value: function getDynamoDBInstance() {
      return this._registry.get("properties", 'dynamodb');
    }

    /**
    * Load entity content container for entity data.
    *
    * @param id
    *   entity id data
    * @param callback
    */

  }, {
    key: 'loadEntityContainer',
    value: function loadEntityContainer(entityId, callback) {
      var self = this;
      var tableName = this.getStorageTableName();
      this.loadDataItem(tableName, entityId, callback);
    }

    /**
    * Load entity content container for entity data. DynamoDB supports only
    * fetching items in batches size of 100 items.
    *
    * TODO: Support throttling
    *
    * @param keys
    *   Array of entity ids.
    * @param callback
    */

  }, {
    key: 'loadEntityContainers',
    value: function loadEntityContainers(entityIds, callback) {
      var self = this;
      var tableName = this.getStorageTableName();
      this.loadDataItems(tableName, entityIds, callback);
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
      this.saveDataItem(this.getStorageTableName(), Object.assign({}, entityId, container), callback);
    }

    /**
    * Delete entity content container.
    *
    * @param entityId
    *   Entity id
    * @param callback
    */

  }, {
    key: 'deleteEntityContainer',
    value: function deleteEntityContainer(entityId, callback) {
      this.deleteDataItem(this.getStorageTableName(), entityId, callback);
    }

    /**
    * Save data to DynamoDB.
    *
    * @param table
    * @param data
    * @param callback
    */

  }, {
    key: 'saveDataItem',
    value: function saveDataItem(table, data, callback) {
      var params = {
        TableName: table,
        Item: this.encodeMap(data)
      };
      this.getDynamoDBInstance().putItem(params, function (err, result) {
        // TODO: Handle throttling
        // TODO: Handle eventually consisency issues...
        callback(err, result);
      });
    }

    /**
    * Load data items.
    *
    * @param table
    * @param key data
    * @param callback
    */

  }, {
    key: 'loadDataItem',
    value: function loadDataItem(table, itemKey, callback) {
      var _this2 = this;

      var params = {
        TableName: table,
        Key: this.encodeMap(itemKey)
      };
      // TODO: Handle throttling
      // TODO: Handle eventually consisency issues...
      this.getDynamoDBInstance().getItem(params, function (err, result) {
        callback(err, _this2.decodeMap(result.Item));
      });
    }

    /**
    * Delete data item.
    *
    * @param table
    * @param key data
    * @param callback
    */

  }, {
    key: 'deleteDataItem',
    value: function deleteDataItem(table, itemKey, callback) {
      var _this3 = this;

      var params = {
        TableName: table,
        Key: this.encodeMap(itemKey)
      };
      // TODO: Handle throttling
      // TODO: Handle eventually consisency issues...
      this.getDynamoDBInstance().deleteItem(params, function (err, result) {
        callback(err, _this3.decodeMap(result.Item));
      });
    }

    /**
    * Load batch of data items.
    *
    * @param table
    * @param ids
    *   Array of key data
    * @param callback
    *   Data collection
    */

  }, {
    key: 'loadDataItems',
    value: function loadDataItems(table, itemKeys, callback) {
      var self = this;
      var result = _domainMap2.default.createCollection({ strictKeyMode: false });
      var countBatches = Math.ceil(itemKeys.length / maxItems);
      var indexeDefinitions = this.getStorageIndexDefinitions();
      var maxItems = 100;
      var pointer = 0;

      function loadBatchData(keys) {
        var params = { RequestItems: {} };
        params.RequestItems[table] = {
          Keys: keys
        };

        self.getDynamoDBInstance().batchGetItem(params, function (err, data) {
          if (err) return callback(err);

          Object.keys(data.Responses).forEach(function (tableName) {
            if (!Array.isArray(data.Responses[tableName])) return;

            data.Responses[tableName].forEach(function (rowData) {
              var data = self.decodeMap(rowData);
              var entityId = self.getStorageHandler().extractEntityId(indexeDefinitions, data);
              result.set(entityId, data);
            });
          });
          getBatch();
        });
      }

      function getBatch() {
        var keys = [];
        if (pointer == itemKeys.length) return callback(null, result);
        while (pointer < itemKeys.length && keys.length < maxItems) {
          keys.push(self.encodeMap(itemKeys[pointer]));
          pointer++;
        }
        loadBatchData(keys);
      }

      getBatch();
    }

    /**
    * Return storege domain defined by storage handler.
    *
    * @return storage domain
    */

  }, {
    key: 'getStorageTableName',
    value: function getStorageTableName() {
      return this.getStorageHandler().getStorageTableName();
    }

    /**
    * Returns prefix for table defined by storage handler.
    *
    * @return storage domain
    */

  }, {
    key: 'getStorageTablePrefix',
    value: function getStorageTablePrefix() {
      return this.getStorageHandler().getStorageTablePrefix();
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
    * Select data from storage. If query doesn't contain table name, we will
    * populate table name to match entity specs.
    *
    * @param variables
    * @param callback
    */

  }, {
    key: 'select',
    value: function select(variables, callback) {
      this.executeSelectQuery(variables, this.buildSelectQuery(variables), callback);
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

      // Check if we should fill table name
      if (variables.hasOwnProperty('table')) query.TableName = this.getStorageTablePrefix() + variables.table;else if (!query.hasOwnProperty('TableName')) query.TableName = this.getStorageTableName();
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
        data.values = self.decodeMap(data.Items);
        callback(null, data);
      };

      if (variables.hasOwnProperty('debug') && variables.debug) _entityApi2.default.log("DDBStorageBackend", JSON.stringify(query));

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
        _entityApi2.default.log("DDBStorageBackend", 'Creating table: ' + schema.TableName);

        self.installSchema(schema, options, function (err, succeed) {
          if (err) {
            _entityApi2.default.log("DDBStorageBackend", err.toString(), 'error');
            errors = true;
          } else if (succeed) {
            _entityApi2.default.log("DDBStorageBackend", 'Table created: ' + schema.TableName);
          } else {
            _entityApi2.default.log("DDBStorageBackend", 'Table not created, already exists: ' + schema.TableName);
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
      var _this4 = this;

      if (!schema.hasOwnProperty('TableName')) return callback(new Error("Missing required 'TableName' field"));

      this.checkStorageTableStatus(schema.TableName, function (err, tableExists) {
        if (err) return callback(err);

        // Skip table creation if table already exists
        if (tableExists) return callback(null, false);

        var dynamodb = _this4._registry.get("properties", 'dynamodb');

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
        _entityApi2.default.log("DDBStorageBackend", 'Deleting table: ' + schema.TableName);

        self.uninstallSchema(schema, options, function (err, succeed) {
          if (err) {
            _entityApi2.default.log("DDBStorageBackend", err.toString(), 'error');
            errors = true;
          } else if (succeed) {
            _entityApi2.default.log("DDBStorageBackend", 'Table deleted: ' + schema.TableName);
          } else {
            _entityApi2.default.log("DDBStorageBackend", 'Table not deleted, might be it didn\'t exists: ' + schema.TableName);
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
      var _this5 = this;

      if (!schema.hasOwnProperty('TableName')) return callback(new Error("Missing required 'TableName' field"));

      this.checkStorageTableStatus(schema.TableName, function (err, tableExists) {
        if (err) return callback(err);

        // Skip table deletion if it doesn't exists
        if (!tableExists) return callback(null, false);

        var dynamodb = _this5._registry.get("properties", 'dynamodb');

        dynamodb.deleteTable({ TableName: schema.TableName }, function (err, data) {
          if (err) callback(err);else callback(null, true);
        });
      });
    }
  }]);

  return DDBStorageBackend;
}(_entityApi.StorageBackend);

exports.default = DDBStorageBackend;
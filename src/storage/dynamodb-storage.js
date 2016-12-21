import DomainMap from 'domain-map'
import EntitySystem, { StorageBackend } from "entity-api"

// TODO:
// Table status, install, update, uninstall
// Entity CRUDi operations

/**
* Simple memory storage backend.
*/
class DDBStorageBackend extends StorageBackend {

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
  constructor(variables = {}) {
    super(variables);

    if (variables.hasOwnProperty('lockUpdates'))
      this.setStorageLock(variables.lockUpdates);

    // Apply dynamodb endpoint
    if (!variables.hasOwnProperty('dynamodb'))
      throw new Error("DynamoDB instance must be provided");

    this._registry.set("properties", 'dynamodb', variables.dynamodb);
  }

  /**
  * Load entity content container for entity data.
  *
  * @param id
  *   entity id data
  * @param callback
  */
  loadEntityContainer(entityId, callback) {
    var self = this;
    let tableName = this.getStorageTableName();
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
  loadEntityContainers(entityIds, callback) {
    var self = this;
    let tableName = this.getStorageTableName();
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
  saveEntityContainer(entityId, container, callback) {
    this.saveDataItem(this.getStorageTableName(), Object.assign({}, entityId, container), callback);
  }

  /**
  * Save data to DynamoDB.
  *
  * @param table
  * @param data
  * @param callback
  */
  saveDataItem(table, data, callback) {
    let dynamodb = this._registry.get("properties", 'dynamodb');
    let params = {
      TableName: table,
      Item: this.encodeMap(data)
    }
    dynamodb.putItem(params, (err, result) => {
      // TODO: Handle throttling
      // TODO: Handle eventually consisency issues...
      callback(err, result);
    })
  }

  /**
  * Load data items.
  *
  * @param table
  * @param key data
  * @param callback
  */
  loadDataItem(table, itemKey, callback) {
    let dynamodb = this._registry.get("properties", 'dynamodb');
    let params = {
      TableName: table,
      Key: this.encodeMap(itemKey)
    }
    // TODO: Handle throttling
    // TODO: Handle eventually consisency issues...
    dynamodb.getItem(params, (err, result) => {
      callback(err, this.decodeMap(result.Item));
    })
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
  loadDataItems(table, itemKeys, callback) {
    var self = this;
    let result = DomainMap.createCollection({ strictKeyMode: false });
    let countBatches = Math.ceil(itemKeys.length / maxItems);
    let indexeDefinitions = this.getStorageIndexDefinitions();
    let dynamodb = this._registry.get("properties", 'dynamodb');
    let maxItems = 100;
    let pointer = 0;

    function loadBatchData(keys) {
      let params = { RequestItems: {} };
      params.RequestItems[table] = {
        Keys: keys
      };

      dynamodb.batchGetItem(params, (err, data) => {
        if (err) return callback(err)

        Object.keys(data.Responses).forEach(tableName => {
          if (!Array.isArray(data.Responses[tableName]))
            return;

          data.Responses[tableName].forEach(rowData => {
            let data = self.decodeMap(rowData);
            let entityId = self.getStorageHandler()
              .extractEntityId(indexeDefinitions, data);
            result.set(entityId, data);
          })
        });
        getBatch();
      });
    }

    function getBatch() {
      let keys = [];
      if (pointer == itemKeys.length)
        return callback(null, result)
      while (pointer < itemKeys.length && keys.length < maxItems) {
        keys.push(self.encodeMap(itemKeys[pointer]));
        pointer++;
      }
      loadBatchData(keys)
    }

    getBatch();
  }

  /**
  * Return storege domain.
  *
  * @return storage domain
  */
  getStorageTableName() {
    return this.getStorageHandler().getStorageTableName();
  }

  /**
  * Return storege domain.
  *
  * @return storage domain
  */
  getStorageIndexDefinitions() {
    return this.getStorageHandler().getStorageIndexDefinitions();
  }

  /**
  * Encode json object to DynamoDB map data structure.
  *
  * @param data
  * @return object
  */
  encodeMap(data) {
    var self = this;
    let result = null;
    let build = {};

    if (data == null)
      return build;

    if (Array.isArray(data)) {
      build = [];
      for (let i = 0; i < data.length; i++) {
        result = self.encodeMapValues(data[i]);
        if (result != null)
          build.push(result)
      }
    } else if (typeof data === 'object') {
      Object.keys(data).forEach((key, index) => {
        result = self.encodeMapValues(data[key]);
        if (result != null)
          build[key] = result;
      });
    } else {
      result = self.encodeMapValues(data);
      if (result != null)
        build = result;
    }
    return build;
  }

  /**
  * Encode map values.
  *
  * @param value
  * @return data
  */
  encodeMapValues(value) {
    let result = null;

    if (value == null)
      return result;

    if (Array.isArray(value)) {
      result = { 'L': this.encodeMap(value) };

    } else if (typeof value === 'object') {
      result = { 'M': this.encodeMap(value) };

    } else {
      let dynamoType = this.getDynamoType(value, 'valueType');
      if (dynamoType == "BOOL") {
        result = {
          'BOOL': value ? true : false
        };
      } else if (dynamoType == "NULL") {
        result = {
          'NULL': value == null ? true : false
        };
      } else {
        let tmp = value.toString();
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
  decodeMap(data) {
    var self = this;
    var build = null;

    if (data == null)
      return build;

    if (Array.isArray(data)) {
      build = [];
      data.map(function(value) {
        build.push(self.decodeMap(value));
      });
    } else if (typeof data === 'object') {
      build = {};
      Object.keys(data).forEach(function(key, index) {
        if (key == 'M' || key == 'L') {
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
  select(variables, callback) {
    var self = this;
    var query = this.buildSelectQuery(variables);
    self.executeSelectQuery(variables, query, (err, result) => {
      if (err) callback(err);
      else callback(null, result);
    })
  }

  /**
  * Build select parameters
  *
  * @param variables with following keys
  *   - query
  * @return params
  */
  buildSelectQuery(variables) {
    var self = this;

    let query = variables.hasOwnProperty('query') ? variables.query : {};

    // Fill basic values
    if (!query.hasOwnProperty('TableName'))
      query.TableName = this.getStorageTableName();

    return query;
  }

  /**
  * Execute query
  *
  * @param variables
  * @param query
  * @param callback
  */
  executeSelectQuery(variables, query, callback) {
    var self = this;

    let dynamodb = this._registry.get("properties", 'dynamodb');

    var resultHandler = (err, data) =>  {
      if (err)
        return callback(err);

      callback(null, data);
    };

    if (variables.hasOwnProperty('debug') && variables.debug)
      EntitySystem.log("DDBStorageBackend", JSON.stringify(query));

    if (variables.method == 'scan') {
      dynamodb.scan(query, resultHandler);
    } else if (variables.method == 'query') {
      dynamodb.query(query, resultHandler);
    } else {
      callback(new Error(`Unknown method: ${variables.method}`));
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
  getDynamoType(value, type = "primitiveType") {
    let dynamoType = false;
    let DynamoTypeMap = {
      'string': 'S',
      'number': 'N',
      'boolean': 'BOOL',
      'null': 'NULL',
      'array': 'L',
      'object': 'M'
    };
    let primitiveMap = {
      'integer': 'number',
      'text': 'string',
      'text_map': 'object',
      'text_list': 'array',
      'image': 'array'
    };

    if (type == "primitiveType" && primitiveMap.hasOwnProperty(value)) {
      dynamoType = primitiveMap[value];

    } else if (type == "valueType") {
      dynamoType = typeof value;
    }

    return dynamoType && DynamoTypeMap.hasOwnProperty(dynamoType) ?
      DynamoTypeMap[dynamoType] : false;
  }

  /**
  * Returns list of DynamoDB tabls installed.
  *
  * @param callback
  */
  getDynamoDBTables(callback) {
    let dynamodb = this._registry.get("properties", 'dynamodb');
    dynamodb.listTables({}, function(err, data) {
      if (err) callback(err)
      else callback(null, data);
    });
  }

  /**
  * Method checks if given table exists.
  *
  * @param tableName
  * @param callback
  */
  checkStorageTableStatus(tableName, callback) {
    this.getDynamoDBTables((err, result) => {
      if (err)
        return callback(err);
      else if (result.TableNames.find(item => item == tableName))
        callback(null, true);
      else
        callback(null, false);
    })
  }

  /**
  * Install schema
  *
  * @param scema
  *   Install one or more schemas
  * @param options
  * @param callback
  */
  installSchemas(schemas, options, callback) {
    let self = this;
    let counter = schemas.length;
    let errors = false;

    if (!counter)
      return callback(null);

    schemas.forEach(schema => {
      EntitySystem.log("DDBStorageBackend", `Creating table: ${schema.TableName}`);

      self.installSchema(schema, options, (err, succeed) => {
        if (err) {
          EntitySystem.log("DDBStorageBackend", err.toString(), 'error');
          errors = true;
        } else if (succeed) {
          EntitySystem.log("DDBStorageBackend", `Table created: ${schema.TableName}`);
        } else {
          EntitySystem.log("DDBStorageBackend", `Table not created, already exists: ${schema.TableName}`);
        }

        counter--;
        if (counter > 0)
          return;
        else if (errors)
          callback(new Error("There was an error when installing schemas."));
        else
          callback(null);
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
  installSchema(schema, options, callback) {
    if (!schema.hasOwnProperty('TableName'))
      return callback(new Error("Missing required 'TableName' field"));

    this.checkStorageTableStatus(schema.TableName, (err, tableExists) => {
      if (err)
        return callback(err);

      // Skip table creation if table already exists
      if (tableExists)
        return callback(null, false);

      let dynamodb = this._registry.get("properties", 'dynamodb');

      dynamodb.createTable(schema, (err, data) => {
        if (err) callback(err);
        else callback(null, true)
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
  updateSchemas(schemas, options, callback) {
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
  uninstallSchemas(schemas, options, callback) {
    let self = this;
    let counter = schemas.length;
    let errors = false;

    if (!counter)
      return callback(null);

    schemas.forEach(schema => {
      EntitySystem.log("DDBStorageBackend", `Deleting table: ${schema.TableName}`);

      self.uninstallSchema(schema, options, (err, succeed) => {
        if (err) {
          EntitySystem.log("DDBStorageBackend", err.toString(), 'error');
          errors = true;
        } else if (succeed) {
          EntitySystem.log("DDBStorageBackend", `Table deleted: ${schema.TableName}`);
        } else {
          EntitySystem.log("DDBStorageBackend", `Table not deleted, might be it didn't exists: ${schema.TableName}`);
        }

        counter--;
        if (counter > 0)
          return;
        else if (errors)
          callback(new Error("There was an error when uninstalling schemas."));
        else
          callback(null);
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
  uninstallSchema(schema, options, callback) {
    if (!schema.hasOwnProperty('TableName'))
      return callback(new Error("Missing required 'TableName' field"));

    this.checkStorageTableStatus(schema.TableName, (err, tableExists) => {
      if (err)
        return callback(err);

      // Skip table deletion if it doesn't exists
      if (!tableExists)
        return callback(null, false);

      let dynamodb = this._registry.get("properties", 'dynamodb');

      dynamodb.deleteTable({ TableName: schema.TableName }, (err, data) => {
        if (err) callback(err);
        else callback(null, true)
      });
    });
  }
}

export default DDBStorageBackend;
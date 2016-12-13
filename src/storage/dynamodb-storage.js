import DomainMap from 'domain-map'
import EntitySystem, { StorageBackend } from "entity-api"

/**
* Simple memory storage backend.
*/
class DynamoDBStorageBackend extends StorageBackend {

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
  loadEntityContainers(ids, callback) {
    var self = this;
    let result = DomainMap.createCollection({ strictKeyMode: false });
    let pointer = 0;
    let maxItems = 100;
    let tableName = this.getStorageTableName();
    let countBatches = Math.ceil(ids.length / maxItems);
    let dynamodb = this._registry.get("properties", 'dynamodb');
    let indexeDefinitions = this.getStorageIndexDefinitions();

    function loadBatchData(keys) {
      let params = { RequestItems: {} };
      params.RequestItems[tableName] = {
        Keys: keys
      };

      dynamodb.batchGetItem(params, (err, data) => {
        if (err) return callback(err)

        // Process data
        Object.keys(data.Responses).forEach(tableName => {
          // Do not process empty reponses;
          if (!Array.isArray(data.Responses[tableName]))
            return;

          data.Responses[tableName].forEach(rowData => {
            let data = self.decodeMap(rowData);
            // TODO: Get entity id dynamically...
            let entityId = self.getStorageHandler().extractEntityId(indexeDefinitions, data);
            result.set(entityId, data);
          })
        });

        getBatch();
      });
    }

    function getBatch() {
      if (pointer == ids.length)
        return callback(null, result)

      let keys = [];
      while (pointer < ids.length && keys.length < maxItems) {
        keys.push({
          entity_id: {
            S: ids[pointer]
          }
        });
        pointer++;
      }
      loadBatchData(keys)
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
  saveEntityContainer(entityId, container, callback) {
    if (this.isStorageLocked())
      return callback(new Error("Storage updates are locked"));

    let domain = this.getStorageDomain();
    this._registry.set(domain, entityId, container);
    callback(null);
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
  * Select data from storage.
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
  * Method checks if entity table exists.
  *
  * @param callback
  */
  checkStorageTableStatus(callback) {
    let dynamodb = this._registry.get("properties", 'dynamodb');
    dynamodb.listTables({}, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);           // successful response
    });
  }

  // TODO:
  // Table creation
  // Save entity
  // Delete entity
  // Update entity
}

export default DynamoDBStorageBackend;
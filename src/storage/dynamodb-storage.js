import DomainMap from 'domain-map'
import { StorageBackend } from "entity-api"

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
  * @param ids
  *   Array of entity ids.
  * @param callback
  *   Passes map of objects keyed with existing entity id. If entity doesn't
  *   exists, it will not be indexed.
  */
  loadEntityContainers(ids, callback) {
    var self = this;
    let result = DomainMap.createCollection({strictKeyMode: false});

    let pointer = 0;
    let maxItems = 100;
    let tableName = this.getEntityTableName();
    let countBatches = Math.ceil(ids.length / maxItems);

    let dynamodb = this._registry.get("properties", 'dynamodb');

    // Load batch data
    function loadBatchData(keys) {
      let params = { RequestItems: {} };
      params.RequestItems[tableName] = {
        Keys: keys
      };

      dynamodb.batchGetItem(params, (err, data) => {
        if (err) return callback(err)

        // Process data
        Object.keys(data.Responses).forEach(table => {
          Object.keys(data.Responses[table]).forEach(row => {
            let rowData = self.processDynamoDBResponse(row);
            // TODO: Get entity id dynamically...
            let entityId = rowData;
            result.set(entityId, rowData);
          })
        });

        self.getBatch();
      });
    }

    // Fetch batch
    // TODO: Support dynamical keys names
    // TODO: Support throttling
    function getBatch(keys = []) {
      if (ids.length == ids.length)
        return callback(null, result)

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
  processDynamoDBResponse(row) {

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
  getEntityTableName() {
    return this.getStorageHandler().getStorageTableName();
  }

  /**
  * Method checks if storage is locked.
  *
  * @return boolean is locked
  */
  isStorageLocked() {
    return this._registry.get("properties", 'lockUpdates', false);
  }

  /**
  * Set storage lock status.
  *
  * @param status
  *   New lock status.
  */
  setStorageLock(status) {
    this._registry.set("properties", 'lockUpdates', status);
  }
}

export default DynamoDBStorageBackend;
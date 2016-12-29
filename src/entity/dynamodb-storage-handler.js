import { EntityStorageHandler } from "entity-api"

class DynamoDBStorageHandler extends EntityStorageHandler {

  /**
  * Construct
  */
  constructor(variables) {
    super(variables);

    // Apply index definitons for storage
    if (variables.hasOwnProperty('storageIndexDefinitions'))
      this._registry.set('properties', 'storageIndexDefinitions', variables.storageIndexDefinitions);

   if (variables.hasOwnProperty('schemaData'))
      this._registry.set('properties', 'schemaData', variables.schemaData);
  }

  /**
  * Hook getStorageIndexDefinitions()
  */
  getStorageIndexDefinitions() {
    return this._registry.get('properties', 'storageIndexDefinitions', []);
  }

  /**
  * Hook getSchemas()
  */
  getSchemas() {
    return [].concat(this._registry.get('properties', 'schemaData', [])).map(data => {
      if (!data.hasOwnProperty('schema'))
        return;

      let schema = data.schema;

      if (!schema.hasOwnProperty('TableName') || !schema.TableName)
        schema.TableName = this.getStorageTableName();
      else
        schema.TableName = this.getStorageTablePrefix() + schema.TableName;
      return schema;
    }).filter(schema => schema != undefined);
  }
}

export default DynamoDBStorageHandler;
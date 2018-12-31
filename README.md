# DynamoDB storage backend for entity-api
[dynamodb-storage-backend](https://www.npmjs.com/package/dynamodb-storage-backend) provides DynamoDB storage for [Entity API](https://www.npmjs.org/package/entity-api).

### Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save dynamodb-storage-backend

### Example usage

```js

import AWS from 'aws-sdk'
import {
  DynamoDBStorageBackend,
  DynamoDBStorageHandler
  } from 'dynamodb-storage-backend'

AWS.config.update({
  region: 'eu-west1'
})

const DB_SCHEMAS = [
  {
    schema:  {
      TableName: 'message',
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH'
        }
      ],
      ProvisionedThroughput:  {
        ReadCapacityUnits: '1',
        WriteCapacityUnits: '1'
      }
    }
  }
]

const backend = new DynamoDBStorageBackend({
    dynamodb: new AWS.DynamoDB({
      // Dynamodb endpoint to be used. This uses Dynamodb local
      endpoint: new AWS.Endpoint('http://localhost:8000')
    })
})

class MessageEntityType extends EntityType {

  constructor(variables = {}) {
    variables.entityTypeId = 'message'
    variables.entityClass = MessageEntity
    variables.handlers = {
      storage: new DynamoDBStorageHandler({
        tablePrefix: 'entity_',
        storage: backend,
        schemaData: DB_SCHEMAS
      }),
      view: new EntityViewHandler(variables),
    }
    super(variables)
  }
}

```

### Test
Run tests using [npm](https://www.npmjs.com/):

    $ npm run test

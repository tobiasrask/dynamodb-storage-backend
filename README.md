# DynamoDB storage backend for entity-api
[dynamodb-storage-backend](https://www.npmjs.com/package/dynamodb-storage-backend) provides DynamoDB storage for [Entity API](https://www.npmjs.org/package/entity-api).

### Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save dynamodb-storage-backend

### Example usage

```js

import { DynamoDBStorageBackend, DynamoDBStorageHandler } from 'dynamodb-storage-backend'
import AWS from 'aws-sdk'

AWS.config.update({
  region: 'eu-west1'
})

const backend = new DynamoDBStorageBackend({
    dynamodb: new AWS.DynamoDB({
    // Dynamodb endpoint to be used. This uses Dynamodb loal
    endpoint: new AWS.Endpoint('http://localhost:8000')
  })
})

const handler = new DynamoDBStorageHandler({
  entityTypeId: 'message',
  tablePrefix: 'entity_',
  storage: backend
})

```

### Test
Run tests using [npm](https://www.npmjs.com/):

    $ npm run test

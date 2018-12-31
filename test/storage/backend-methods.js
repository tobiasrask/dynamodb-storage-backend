import { DynamoDBStorageBackend, DynamoDBStorageHandler } from './../../src/index'

import AWS from 'aws-sdk'

describe('Storage backend methods', () => {
  describe('Test methods provided DynamoDB storage backend.', () => {

    it('It should handle table prefixes', (done) => {
      let entityTypeId = 'test'
      let tablePrefix = 'tablePrefixTest_'

      AWS.config.update({
        region: 'eu-west1'
      })

      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint('http://localhost:8000')
        })
      })

      const handler = new DynamoDBStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend,
        tablePrefix: tablePrefix
      })

      if (!handler) {
        return done(new Error('Handler is not provided'))
      }

      if (backend.getStorageTablePrefix() != tablePrefix) {
        return done(new Error('Storage backend table prefix was not expected'))
      }

      if (backend.getStorageTableName() != `${tablePrefix}${entityTypeId}`) {
        return done(new Error('Storage backend table name was not prefixed as expected'))
      }

      done()
    })
  })

})
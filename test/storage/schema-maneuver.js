import { DynamoDBStorageBackend, DynamoDBStorageHandler } from './../../src/index'
import equal from 'deep-equal'
import AWS from 'aws-sdk'

const DB_SCHEMAS = [
  {
    schema:  {
      TableName: '',
      AttributeDefinitions: [
        {
          AttributeName: 'entity_id',
          AttributeType: 'S'
        },
        {
          AttributeName: 'testfield',
          AttributeType: 'S'
        },
        {
          AttributeName: 'numberfield',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'entity_id',
          KeyType: 'HASH'
        }
      ],
      ProvisionedThroughput:  {
        ReadCapacityUnits: '1',
        WriteCapacityUnits: '1'
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'testIndex',
          KeySchema: [
            {
              AttributeName: 'testfield',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'numberfield',
              KeyType: 'RANGE',
            }
          ],
          Projection: {
            ProjectionType: 'KEYS_ONLY'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ]
    }
  },
  {
    schema: {
      TableName: '_schema_test_custom_table',
      AttributeDefinitions: [
        {
          AttributeName: 'testfield',
          AttributeType: 'S'
        },
        {
          AttributeName: 'numberfield',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'testfield',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'numberfield',
          KeyType: 'RANGE',
        }
      ],
      ProvisionedThroughput:  {
        ReadCapacityUnits: '1',
        WriteCapacityUnits: '1'
      }
    }
  }
]

class CustomStorageHandler extends DynamoDBStorageHandler {
  constructor(variables) {
    variables.schemaData = DB_SCHEMAS
    super(variables)
  }
  getStorageTableName() {
    return '_schema_test'
  }
  getStorageIndexDefinitions() {
    return [{ fieldName: 'entity_id' }]
  }
}

describe('DynamoDB schema maneuvers', () => {
  describe('Schema uninstallation', () => {
    it('It should uninstall schemas if exists', (done) => {
      const entityTypeId = 'test'
      AWS.config.update({
        region: 'eu-west1'
      })
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint('http://localhost:8000')
        })
      })
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      })
      handler.uninstall()
        .then((_result) => {
          done()
        })
        .catch(done)
    })
  })

  describe('Schema installation', () => {
    it('It should install schemas', (done) => {
      const entityTypeId = 'test'
      AWS.config.update({
        region: 'eu-west1'
      })
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint('http://localhost:8000')
        })
      })
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      })
      handler.install()
        .then((_result) => {
          done()
        })
        .catch(done)
    })
  })

  describe('Schema storage', () => {
    it('It should save, load and delete data from schema tables', (done) => {
      AWS.config.update({
        region: 'eu-west1'
      })
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint('http://localhost:8000')
        })
      })


      const entityTypeId = 'test'
      const handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      })

      if (!handler) {
        return done(new Error('Handler is not provided'))
      }

      const itemKey = {
        entity_id: '12345'
      }
      let fields = {
        fieldA: '123',
        fieldB: '456',
        fieldC: '789'
      }
      let testItem = Object.assign({}, itemKey, fields)

      backend.saveEntityContainer(itemKey, fields, (err) => {
        if (err) {
          return done(err)
        }

        backend.loadEntityContainer(itemKey, (err, container) => {
          if (err) {
            return done(err)
          }

          if (!equal(testItem, container)) {
            return done('Loaded DynamoDB container is not expected.')
          }

          backend.deleteEntityContainer(itemKey, (err, _result) => {
            if (err) {
              return done(err)
            }

            backend.loadEntityContainer(itemKey, (err, container) => {
              if (err) {
                return done(err)
              }

              if (container) {
                done(new Error('It didn\'t delete entity container'))
              } else {
                done()
              }
            })
          })
        })
      })
    })
  })

  describe('Schema uninstallation', () => {
    it('It should uninstall schemas', (done) => {
      const entityTypeId = 'test'
      AWS.config.update({
        region: 'eu-west1'
      })
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint('http://localhost:8000')
        })
      })
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      })
      handler.uninstall()
        .then((_result) => {
          done()
        })
        .catch(done)
    })
  })
})

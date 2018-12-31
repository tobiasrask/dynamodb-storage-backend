import DynamoDBStorageBackend from './../../src/index'
import equal from 'deep-equal'
import { EntityStorageHandler } from 'entity-api'


describe('DynamoDB storage backend', () => {

  describe('Invalid construction', () => {
    it('It should throw error if dynamodb instance is not provided', (done) => {
      try {
        const backend = new DynamoDBStorageBackend()
        if (backend) {
          done(new Error('Backend was provided with missing parameters'))
        }
        done(new Error('It didn\'t throw error when DynamoDB instance is missing'))
      } catch (err) {
        return done()
      }
    })
  })

  describe('Construction', () => {
    it('Should construct with without errors', (done) => {
      class DynamoDB {}
      const backend = new DynamoDBStorageBackend({
        dynamodb: new DynamoDB()
      })
      if (!backend) {
        done(new Error('No instance'))
      }
      done()
    })
  })

  describe('Data encoding & decoding', () => {
    it('It should encode and decode json data do DynamoDB format', (done) => {
      class DynamoDB {}
      let backend = new DynamoDBStorageBackend({
        dynamodb: new DynamoDB()
      })

      var sourceData = {
        string_field: 'stringValue',
        array_field: [1, 'stringValue', 3, true],
        boolean_field: true,
        null_field: null,
        object_field: {
          a: 1,
          b: 'stringValue',
          c: [1,2,'stringValue'],
          d: {
            a: 'stringValue'
          }
        }
      }

      const expectedData = {
        string_field: {
          S: 'stringValue'
        },
        array_field: {
          L: [
            { N: '1' },
            { S: 'stringValue' },
            { N: '3' },
            { BOOL: true }
          ]
        },
        boolean_field: {
          BOOL: true
        },
        object_field: {
          M: {
            a: { N: '1' },
            b: { S: 'stringValue' },
            c: {
              L: [
                { N: '1' },
                { N: '2' },
                { S: 'stringValue' }
              ]
            },
            d: {
              M: {
                a: {
                  S: 'stringValue'
                }
              }
            }
          }
        }
      }

      let encodedData = backend.encodeMap(sourceData)

      if (!equal(expectedData, encodedData)) {
        return done(new Error('DynamoDB encoded data was not expected'))
      }

      let decodedData = backend.decodeMap(encodedData)

      // Dynamodb doesn\'t support null values, so it removes them
      delete sourceData['null_field']

      if (!equal(sourceData, decodedData)) {
        return done(new Error('DynamoDB decoded data was not expected'))
      }

      done()
    })
  })

  describe('loadEntityContainers', () => {
    it('Should load items as patch', (done) => {
      class DynamoDB {
        batchGetItem(params, callback) {
          let data = { Responses: {} }
          Object.keys(params.RequestItems).forEach((tableName) => {
            data.Responses[tableName] = [
              {
                'entity_id': 123,
                'name': 'DynamoDB',
                'age': '31'
              }
            ]
            params.RequestItems[tableName]
          })
          callback(null, data)
        }
      }

      let backend = new DynamoDBStorageBackend({
        dynamodb: new DynamoDB()
      })

 
      const entityTypeId = 'test'
      class CustomHandler extends EntityStorageHandler {
        getStorageIndexDefinitions() {
          return [{ fieldName: 'entity_id' }]
        }
      }

      const handler = new CustomHandler({
        entityTypeId: entityTypeId,
        storage: backend
      })

      if (!handler) {
        return done(new Error('Handler is not provided'))
      }

      backend.loadEntityContainers([{ entity_id: 123 }], (err, _result) => {
        if (err) {
          return done(err)
        }
        done()
      })
    })
  })

})

import { DynamoDBStorageHandler } from './../../src/index'

describe('Storage handler', () => {

  describe('Test methods provided by DynamoDB storage handler.', () => {
    it('It should shandle schemas with missing table names', (done) => {
      let erros = []
      let entityTypeId = 'test'
      let schemaKey = 'testSchemaKey'
      let tablePrefix = 'tablePrefixTest_'

      let handler = new DynamoDBStorageHandler({
        entityTypeId: entityTypeId,
        tablePrefix: tablePrefix,
        schemaData: [
          {
            schema: {
              schemaKey: `${schemaKey}_row_0`
            }
          },
          {
            title: 'This is not valid schema, it will be dropped.'
          },
          {
            schema: {
              schemaKey:`${schemaKey}_row_1`
            }
          }
        ]
      })

      if (handler.getStorageTablePrefix() != tablePrefix) {
        return done(new Error('Storage backend table prefix was not expected'))
      }

      if (handler.getStorageTableName() != `${tablePrefix}${entityTypeId}`) {
        return done(new Error('Storage backend table name was not prefixed as expected'))
      }

      let schemas = handler.getSchemas()

      if (!schemas || schemas.length != 2) {
        return done(new Error('Schema length doesn\'t match'))
      }

      schemas.forEach((schema, index) => {
        if (schema.TableName != `${tablePrefix}${entityTypeId}`) {
          erros.push(new Error('Schema table name is not expected.'))
        }

        if (schema.schemaKey != `${schemaKey}_row_${index}`) {
          erros.push(new Error('Schema key doesn\'t match.'))
        }
      })

      if (erros.length) {
        done(erros.pop())
      } else {
        done()
      }
    })
  })

  describe('Test methods provided by DynamoDB storage handler.', () => {
    it('It should handle schemas with predefined table names', (done) => {
      let erros = []
      let entityTypeId = 'test'
      let tablePrefix = 'tablePrefixTest_'
      let tableName = 'testTableName'

      let handler = new DynamoDBStorageHandler({
        entityTypeId: entityTypeId,
        tablePrefix: tablePrefix,
        schemaData: [
          {
            schema: {
              TableName: `${tableName}_row_0`
            }
          },
          {
            title: 'This is not valid schema, it will be dropped.'
          },
          {
            schema: {
              TableName: `${tableName}_row_1`
            }
          }
        ]
      })

      if (handler.getStorageTablePrefix() != tablePrefix) {
        return done(new Error('Storage backend table prefix was not expected'))
      }

      if (handler.getStorageTableName() != `${tablePrefix}${entityTypeId}`) {
        return done(new Error('Storage backend table name was not prefixed as expected'))
      }

      const schemas = handler.getSchemas()

      if (!schemas || schemas.length != 2) {
        return done(new Error('Schema length doesn\'t match'))
      }

      schemas.forEach((schema, index) => {
        if (schema.TableName != `${tablePrefix}${tableName}_row_${index}`) {
          erros.push(new Error('Schema table name is not expected.'))
        }
      })

      if (erros.length) {
        done(erros.pop())
      } else {
        done()
      }
    })
  })
})

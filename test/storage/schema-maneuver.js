import assert from "assert"
import DynamoDBStorageBackend from "./../../src/index"
import { EntityStorageHandler } from "entity-api"
import util from 'util'
import equal from 'deep-equal'
import AWS from 'aws-sdk'

describe('DynamoDB schema maneuvers', () => {

  describe('Schema installation', () => {
    it('It should install schemas', done => {

      let entityTypeId = 'test';

      AWS.config.update({
        region: 'eu-west1'
      });

      // TODO: Allow endpoint configuration...
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint("http://localhost:8000")
        })
      });

      class CustomStorageHandler extends EntityStorageHandler {

        getStorageTableName() {
          return '_schema_test';
        }

        getStorageIndexDefinitions() {
          return [{ fieldName: "entity_id" }];
        }

        getSchemas() {
          return [
            {
              TableName: this.getStorageTableName(),
              AttributeDefinitions: [
                {
                  AttributeName: "entity_id",
                  AttributeType: "S"
                },
                {
                  AttributeName: "testfield",
                  AttributeType: "S"
                },
                {
                  AttributeName: "numberfield",
                  AttributeType: "N"
                }
              ],
              KeySchema: [
                {
                  AttributeName: "entity_id",
                  KeyType: "HASH"
                }
              ],
              ProvisionedThroughput:  {
                ReadCapacityUnits: "1",
                WriteCapacityUnits: "1"
              },
              GlobalSecondaryIndexes: [
                {
                  IndexName: "testIndex",
                  KeySchema: [
                    {
                      AttributeName: "testfield",
                      KeyType: "HASH",
                    },
                    {
                      AttributeName: "numberfield",
                      KeyType: "RANGE",
                    }
                  ],
                  Projection: {
                    ProjectionType: "KEYS_ONLY"
                  },
                  ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1
                  }
                }
              ]
            },
            {
              TableName: "_schema_test_custom_table",
              AttributeDefinitions: [
                {
                  AttributeName: "testfield",
                  AttributeType: "S"
                },
                {
                  AttributeName: "numberfield",
                  AttributeType: "N"
                }
              ],
              KeySchema: [
                {
                  AttributeName: "testfield",
                  KeyType: "HASH",
                },
                {
                  AttributeName: "numberfield",
                  KeyType: "RANGE",
                }
              ],
              ProvisionedThroughput:  {
                ReadCapacityUnits: "1",
                WriteCapacityUnits: "1"
              }
            }
          ];
        }
      }

      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      });

      handler.install()
      .then(result => {
        return handler.uninstall();
      })
      .then(result => {
        done();
      })
      .catch(done);
    })
  });
});

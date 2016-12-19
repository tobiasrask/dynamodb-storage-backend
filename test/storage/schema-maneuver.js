import DynamoDBStorageBackend from "./../../src/index"
import { EntityStorageHandler } from "entity-api"
import assert from "assert"
import equal from 'deep-equal'
import util from 'util'
import AWS from 'aws-sdk'

const DB_SCHEMA = [
  {
    TableName: '',
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

class CustomStorageHandler extends EntityStorageHandler {
  getStorageTableName() {
    return '_schema_test';
  }
  getStorageIndexDefinitions() {
    return [{ fieldName: "entity_id" }];
  }
  getSchemas() {
    let schema = DB_SCHEMA;
    schema[0]['TableName'] = this.getStorageTableName();
    return schema;
  }
}

describe('DynamoDB schema maneuvers', () => {
  describe('Schema installation', () => {
    it('It should install schemas', done => {
      let entityTypeId = 'test';
      AWS.config.update({
        region: 'eu-west1'
      });
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint("http://localhost:8000")
        })
      });
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      });
      handler.install()
      .then(result => {
        done();
      })
      .catch(done);
    })
  });

  describe('Schema storage', () => {
    it('It should save and load data from schema tables', done => {
      let entityTypeId = 'test';
      AWS.config.update({
        region: 'eu-west1'
      });
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint("http://localhost:8000")
        })
      });
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      });
      let itemKey = {
        entity_id: '12345'
      }
      let fields = {
        fieldA: '123',
        fieldB: '456',
        fieldC: '789'
      }
      let testItem = Object.assign({}, itemKey, fields);
      backend.saveEntityContainer(itemKey, fields, err => {
        if (err)
          return done(err);
        backend.loadEntityContainer(itemKey, (err, container) => {
          if (err)
            return done(err);
          if (!equal(testItem,container))
            return done("Loaded DynamoDB container is not expected.");
          done();
        });
      });
    })
  });

  describe('Schema uninstallation', () => {
    it('It should uninstall schemas', done => {
      let entityTypeId = 'test';
      AWS.config.update({
        region: 'eu-west1'
      });
      let backend = new DynamoDBStorageBackend({
        dynamodb: new AWS.DynamoDB({
          endpoint: new AWS.Endpoint("http://localhost:8000")
        })
      });
      let handler = new CustomStorageHandler({
        entityTypeId: entityTypeId,
        storage: backend
      });
      handler.uninstall()
      .then(result => {
        done();
      })
      .catch(done);
    })
  });
});
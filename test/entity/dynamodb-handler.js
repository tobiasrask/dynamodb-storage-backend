import { DynamoDBStorageHandler } from "./../../src/index"
import assert from "assert"
import equal from 'deep-equal'
import util from 'util'
import AWS from 'aws-sdk'

describe('Storage handler', () => {
  describe('Test methods provided by DynamoDB storage handler.', () => {

    it('It should schema conversions', done => {
      let entityTypeId = 'test';
      let tablePrefix = 'tablePrefixTest_';

      let handler = new DynamoDBStorageHandler({
        entityTypeId: entityTypeId,
        tablePrefix: tablePrefix
      });

      if (handler.getStorageTablePrefix() != tablePrefix)
        return done(new Error("Storage backend table prefix was not expected"));

      if (handler.getStorageTableName() != `${tablePrefix}${entityTypeId}`)
        return done(new Error("Storage backend table name was not prefixed as expected"));

      done();
    })
  });

});
import assert from "assert"
import DynamoDBStorageBackend from "./../../src/index"

describe('DynamoDB storage backend', () => {

  describe('Invalid construction', () => {
    it('It should throw error if dynamodb instance is not provided', done => {
      try {
        let backend = new DynamoDBStorageBackend();
      } catch (err) {
        return done();
      }
      done(new Error("It dint' throw error when DynamoDB instance is missing"));
    })
  });

  describe('Construction', () => {
    it('Should construct with without errors', done => {
      class DynamoDB {}
      let backend = new DynamoDBStorageBackend({
        dynamodb: new DynamoDB()
      });
      done();
    })
  });
});

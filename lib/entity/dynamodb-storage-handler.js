'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _entityApi = require('entity-api');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DynamoDBStorageHandler = function (_EntityStorageHandler) {
  _inherits(DynamoDBStorageHandler, _EntityStorageHandler);

  /**
  * Construct
  */
  function DynamoDBStorageHandler(variables) {
    _classCallCheck(this, DynamoDBStorageHandler);

    // Apply index definitons for storage
    var _this = _possibleConstructorReturn(this, (DynamoDBStorageHandler.__proto__ || Object.getPrototypeOf(DynamoDBStorageHandler)).call(this, variables));

    if (variables.hasOwnProperty('storageIndexDefinitions')) _this._registry.set('properties', 'storageIndexDefinitions', variables.storageIndexDefinitions);

    if (variables.hasOwnProperty('schemaData')) _this._registry.set('properties', 'schemaData', variables.schemaData);
    return _this;
  }

  /**
  * Hook getStorageIndexDefinitions()
  */


  _createClass(DynamoDBStorageHandler, [{
    key: 'getStorageIndexDefinitions',
    value: function getStorageIndexDefinitions() {
      return this._registry.get('properties', 'storageIndexDefinitions', []);
    }

    /**
    * Hook getSchemas()
    */

  }, {
    key: 'getSchemas',
    value: function getSchemas() {
      var _this2 = this;

      return this._registry.get('properties', 'schemaData', []).map(function (data) {
        if (!data.hasOwnProperty('schema')) return;

        var schema = Object.assign({}, data.schema);

        if (!schema.hasOwnProperty('TableName') || !schema.TableName) schema.TableName = _this2.getStorageTableName();else schema.TableName = _this2.getStorageTablePrefix() + schema.TableName;
        return schema;
      }).filter(function (schema) {
        return schema != undefined;
      });
    }
  }]);

  return DynamoDBStorageHandler;
}(_entityApi.EntityStorageHandler);

exports.default = DynamoDBStorageHandler;
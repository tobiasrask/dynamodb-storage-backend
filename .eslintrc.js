module.exports = {
  "extends": "eslint:recommended",
  "parser": "babel-eslint",
  "env": {
    "es6": true,
    "node": true
  },
  "rules": {
    "indent": ["error", 2],
    "align": [
      true,
      "parameters",
      "statements"
    ],
    "arrow-parens": ["error", "always"],
    "max-len": ["error", { "code": 160 }],
    "member-access": false,
    "no-namespace": false,
    "no-var-requires": false,
    "object-literal-key-quotes": false,
    "object-literal-sort-keys": false,
    "ordered-imports": false,
    "prefer-for-of": false,
    "quotemark": [
      "single",
      "jsx-double"
    ],
    "semi": ["error", "never"],
    "semicolon": [
      false
    ],
    "switch-default": false,
    "trailing-comma": [
      false
    ],
    "variable-name": [
      "check-format",
      "allow-leading-underscore",
      "allow-pascal-case"
    ],
    "whitespace": false,
    "no-unused-vars": [
      "error",
      {
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }
    ],
    "quotes": ["error", "single"],
    "curly": "error",
    "no-console": "off"
  },
  "globals": {
    "describe": true,
    "before": true,
    "beforeEach": true,
    "after": true,
    "afterEach": true,
    "it": true
  }
}

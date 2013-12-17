# mongoose-private-paths [![Build Status](https://secure.travis-ci.org/yamadapc/mongoose-private-paths?branch=master)](http://travis-ci.org/yamadapc/mongoose-private-paths)

A simple mongoose plugin to provide private Schema keys

## Getting Started
Install the module with: `npm install mongoose-private-paths`

```javascript
var mongoose = require('mongoose'),
    privatePaths = require('mongoose-private-paths');

var TestSchema = new mongoose.Schema({
  public:       { type: String },
  _private:     { type: String },
  also_private: { type: String, private: true },
  not_private:  { type: String, private: false }
  _even:        { type: String, private: false }
});

TestSchema.plugin(privatePaths);

var Test = mongoose.model('Test', Testschema);

var test = new Test({
  public:       'all keys are public by default!',
  _private:     'keys prefixed with an "_" will be private - except "_id"',
  also_private: 'stuff with a "private" field set to true will be... private!',
  not_private:  'stuff with a "private" field set to false will be... NOT private!',
  _even:        'if they are prefixed with an "_"'
});

test.toJSON(); // =>
// {
//   public:       'all keys are public by default!',
//   _not_private: 'stuff with a "private" field set to false will be... NOT private!',
//   _even:        'if they are prefixed with an "_"'
// }
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
Just lint and test using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2013 . Licensed under the MIT license.

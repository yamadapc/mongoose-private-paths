mongoose-private-paths
======================
[![Build Status](https://travis-ci.org/yamadapc/mongoose-private-paths.png?branch=master)](https://travis-ci.org/yamadapc/mongoose-private-paths)
[![Code Climate](https://codeclimate.com/github/yamadapc/mongoose-private-paths.png)](https://codeclimate.com/github/yamadapc/mongoose-private-paths)
[![Coverage Status](https://coveralls.io/repos/yamadapc/mongoose-private-paths/badge.png)](https://coveralls.io/r/yamadapc/mongoose-private-paths)
[![Analytics](https://ga-beacon.appspot.com/UA-54450544-1/mongoose-private-paths/README)](https://github.com/igrigorik/ga-beacon)
[![Dependency Status](https://david-dm.org/yamadapc/mongoose-private-paths.svg)](https://david-dm.org/yamadapc/mongoose-private-paths)
[![devDependency Status](https://david-dm.org/yamadapc/mongoose-private-paths/dev-status.svg)](https://david-dm.org/yamadapc/mongoose-private-paths#info=devDependencies)
[![peerDependency Status](https://david-dm.org/yamadapc/mongoose-private-paths/peer-status.svg)](https://david-dm.org/yamadapc/mongoose-private-paths#info=peerDependencies)
- - -

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
  not_private:  { type: String, private: false },
  _even:        { type: String, private: false },
  works_too:   [{ type: String, private: false }]
});

TestSchema.plugin(privatePaths);

var Test = mongoose.model('Test', Testschema);

var test = new Test({
  public:       'all keys are public by default!',
  _private:     'keys prefixed with an "_" will be private - except "_id"',
  also_private: 'stuff with a "private" field set to true will be... private!',
  not_private:  'stuff with a "private" field set to false will be... NOT private!',
  _even:        'if they are prefixed with an "_"',
  works_too:    'array-like fields should work too'
});

test.toJSON(); // =>
// {
//   _id:          '1234',
//   public:       'all keys are public by default!',
//   not_private: 'stuff with a "private" field set to false will be... NOT private!',
//   _even:        'if they are prefixed with an "_"'
// }
```

## Documentation

As of right now there're only two options available, to be passed when calling
`Schema.plugin(privatePaths, options)`:

- **ignore** => an Array of keys to ignore (they'll all be public)
- **prefix** => a different private key prefix (to be used instead of "\_")

### `document.toJSON([options])`

It should be noted that the `toJSON` method is overloaded with an optional
`options` parameter, with the following keys:

- **keep**   => Either an array of keys or a single key to ignore (not omit)
- **remove** => Either an array of keys or a single key to remove (the default
  behaviour is overridden, to _only_ remove the specified keys)

### `Model.omitPrivatePaths(doc, [options])`

This is a static function which holds the actual logic for the overloaded
`.toJSON` on documents. It's exported to support serializing
[`lean`](http://mongoosejs.com/docs/api.html#query_Query-lean) mongoose objects,
avoiding the mongoose overhead for lists and things like that. It takes a
document or lean object as its first argument and the options node as its
second.

### `Model.findPrivate(query)`

This returns a `Query` only selecting public fields.

## License
Copyright (c) 2014. Licensed under the MIT license.

## Donations
Would you like to buy me a beer? Send bitcoin to 3JjxJydvoJjTrhLL86LGMc8cNB16pTAF3y

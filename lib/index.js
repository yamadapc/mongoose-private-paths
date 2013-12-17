'use strict';
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var _ = require('lodash');


/**
 * Plugin
 * --------------------------------------------------------------------------*/

module.exports = function(schema, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var private_paths = getPrivatePaths(schema, options);

  var toJSON = schema.methods.toJSON;

  schema.methods.toJSON = function() {
    var obj = toJSON ? toJSON.apply(this, arguments) :
                       this.toObject.apply(this, arguments);
    return _.omit(obj, private_paths);
  };
};


/**
 * Utility functions
 * --------------------------------------------------------------------------*/

function getPrivatePaths(schema, options) {
  var paths  = _.keys(schema.tree),
      ignore = options.ignore,
      prefix = options.prefix;

  return _.filter(paths, function(path) {
    if(_.contains(ignore, path)) return false;
    else if(schema.tree[path].private === false) return false;
    else return schema.tree[path].private || path[0] === prefix;
  });
}


/**
 * Constants and name-maps
 * --------------------------------------------------------------------------*/

var DEFAULT_OPTIONS = {
  prefix: '_',
  ignore: ['_id']
};

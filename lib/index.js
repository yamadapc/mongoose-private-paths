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

  var private_paths = getPaths(schema, options);

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

function getPaths(schema, options) {
  return _.reduce(schema.tree, function(memo, node, path) {
    if(isPrivate(options, node, path)) memo.push(path);
    return memo;
  }, []);
}

function isPrivate(options, node, path) {
  // Array case
  if(node instanceof Array) return isPrivate(options, _.first(node), path);
  // Base case
  else if(_.contains(options.ignore, path)) return false;
  else if(node.private === false) return false;
  else return node.private || path[0] === options.prefix;
}


/**
 * Constants and name-maps
 * --------------------------------------------------------------------------*/

var DEFAULT_OPTIONS = {
  prefix: '_',
  ignore: ['_id']
};

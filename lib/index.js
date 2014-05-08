'use strict';
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var _ = require('lodash');


/*!
 * Plugin
 * --------------------------------------------------------------------------*/

module.exports = function(schema, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var private_paths = getPaths(schema, options);

  var toJSON = schema.methods.toJSON;

  schema.methods.toJSON = function(options) {
    var obj = toJSON ? toJSON.apply(this, arguments) :
                       this.toObject.apply(this, arguments);

    if(options) {
      var keep   = options.keep,
          remove = options.remove;

      // don't omit specified `keep` key(s).
      if(keep) {
        return _.isArray(keep)? _.omit(obj, withoutAll(private_paths, keep)):
                                _.omit(obj,  _.without(private_paths, keep));
      }
      // only omit the specified `remove` key(s).
      else if(remove) {
        return _.omit(obj, remove);
      }
    }

    // omit all private paths by default
    return _.omit(obj, private_paths);
  };
};


/*!
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

function withoutAll(arr, values) {
  var args = _.clone(values);
  args.unshift(arr);
  return _.without.apply(_, args);
}


/*!
 * Constants and name-maps
 * --------------------------------------------------------------------------*/

var DEFAULT_OPTIONS = {
  prefix: '_',
  ignore: ['_id']
};

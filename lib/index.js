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

  var omitPrivatePaths =
  schema.statics.omitPrivatePaths = function(doc, options/*, ...*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    var obj;
    if(toJSON) obj = toJSON.apply(doc, args);
    else if(doc.toObject) obj = doc.toObject.apply(doc, args);
    else obj = doc;

    if(options) {
      var keep   = options.keep,
          remove = options.remove;

      // don't omit specified `keep` key(s).
      if(keep) {
        return nestedOmit(obj, _.omit(private_paths, keep));
      }
      // only omit the specified `remove` key(s).
      else if(remove) {
        return nestedOmit(obj, toPaths(_.isArray(remove) ? remove : [remove]));
      }
    }

    // omit all private paths by default
    return nestedOmit(obj, private_paths);
  };

  schema.methods.toJSON = function(/*options, ...*/) {
    var args = Array.prototype.concat.apply(this, arguments);
    return omitPrivatePaths.apply(this.constructor, args);
  };
};


/*!
 * Utility functions
 * --------------------------------------------------------------------------*/

function nestedOmit(obj, paths) {
  return _.reduce(obj, function(memo, value, key) {
    var p = paths[key],
        t;

    if(_.isObject(p)) {
      if(_.isArray(value)) {
        memo[key] = _.map(value, function(v) {
          return nestedOmit(v, p);
        });
      }
      else if(_.isObject(value)) {
        t = nestedOmit(value, p);
        !_.isEmpty(t) && (memo[key] = t);
      }
    }
    else if(!p) {
      memo[key] = value;
    }

    return memo;
  }, {});
}

function toPaths(arr) {
  return _.reduce(arr, function(memo, v) {
    memo[v] = true;
    return memo;
  }, {});
}

function getPaths(schema, options) {
  return _.reduce(schema.tree, function(memo, node, path) {
    var p = isPrivate(options, node, path);
    p && (memo[path] = p);
    return memo;
  }, {});
}

function isPrivate(options, node, path) {
  if(!node) return false;

  // Array case
  if(node instanceof Array) {
    var f = _.first(node);

    // Nested Schema case
    if(f && f.tree) return getPaths(f, {});
    else return isPrivate(options, f, path);
  }
  // Object case
  else if(_.isObject(node) && !node.type && !node.getters) {
    var s = { tree: node },
        o = getPaths(s, {});

    return _.isEmpty(o) ? false : o;
  }
  // Base case
  else if(_.contains(options.ignore, path)) return false;
  else if(node.private === false) return false;
  else return node.private || path[0] === options.prefix;
}

/*!
 * Constants and name-maps
 * --------------------------------------------------------------------------*/

var DEFAULT_OPTIONS = {
  prefix: '_',
  ignore: ['_id']
};

'use strict';
/*!
 * Dependencies
 * --------------------------------------------------------------------------*/

var _        = require('lodash'),
    mongoose = require('mongoose');


/*!
 * Plugin
 * --------------------------------------------------------------------------*/

module.exports = function(schema, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var private_paths = getPaths(schema, options);
  var refs = getRefs(schema);

  var toJSON = schema.methods.toJSON;

  schema.statics.findPrivate = function(query) {
    var select = _(private_paths)
      .map(function getSelect(v, p) {
        if(!_.isEmpty(v)) {
          return _.map(v, function(v2, p2) {
            return p + '.' + getSelect(v2, p2);
          });
        }

        return p;
      })
      .map(function(p) {
        return '-' + p;
      })
      .join(' ');

    return this
      .find(query)
      .select(select);
  };

  var omitPrivatePaths =
  schema.statics.omitPrivatePaths = function(doc, options/*, ...*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    var obj;
    if(toJSON) obj = toJSON.apply(doc, args);
    else if(doc.toObject) obj = doc.toObject.apply(doc, args);
    else obj = doc;

    var populated = _.reduce(obj, function(memo, value, path) {
      if(doc.populated && !!doc.populated(path)) {
        memo.push(path);
      }
      return memo;
    }, []);

    if(!!populated[0]) {
      obj = omitPopulated(refs, obj, populated, options);
    }

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

function omitPopulated(refs, obj, populated, options) {
  for(var i = 0, len = populated.length; i < len; i++) {
    var path = populated[i];
    var modelName = refs[path] && (_.isArray(refs[path]) ? refs[path][0].ref : refs[path].ref);
    var model;
    if(modelName) {
      model = mongoose.model(modelName);
    } else if(obj[path] && obj[path].constructor) {
      model = obj[path].constructor;
    }

    if(!model || !model.omitPrivatePaths) continue;
    if (_.isArray(obj[path])) {
    for (var j = 0, jlen = obj[path].length; j < jlen; j++) {
      obj[path][j] = model.omitPrivatePaths(obj[path][j], options);
    }
    } else {
      obj[path] = model.omitPrivatePaths(obj[path], options);
    }
  }
  return obj;
}

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

function getRefs(schema) {
  return _.reduce(schema.tree, function(memo, node, path) {
    isRef(node) && (memo[path] = node);
    return memo;
  }, {});
}

function isRef(node) {
  if(_.isArray(node)) {
    return !!node[0].ref;
  } else return !!node.ref;
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
  // Single subdocument case
  else if(node instanceof mongoose.Schema){
    if(node && node.tree) return getPaths(node, {});
    else return isPrivate(options, node, path);
  }
  // Object case
  else if(_.isObject(node) && !_.isFunction(node) && !node.type && !node.getters) {
    var s = { tree: node },
        o = getPaths(s, {});

    return _.isEmpty(o) ? false : o;
  }
  // Base case
  else if(_.includes(options.ignore, path)) return false;
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

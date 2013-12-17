'use strict'; /* global describe, it, before */
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var privatePaths = require('..');

var _        = require('lodash'),
    mongoose = require('mongoose'),
    should   = require('should');

/**
 * Tests
 * --------------------------------------------------------------------------*/

describe('mongoose-private-paths', function() {
  describe('without passing any options', function() {
    var Test, test, obj;

    before(function() {
      var TestSchema = new mongoose.Schema({
        public:           { type: String },
        _private:         { type: String },
        weird:            { type: String, private: true },
        _uber_weird:      { type: String, private: false },
        mega_uber_weird: [{ type: String, private: true, default: [] }]
      });

      TestSchema.plugin(privatePaths);

      Test = mongoose.model('NoOpTest', TestSchema);
      test = new Test({
        public:      'Name',
        _private:    'password',
        weird:       '.jshintrc',
        _uber_weird: '.tmux.conf'
      });
    });

    it('preserves the Model\'s toJSON method', function() {
      should.exist(test.toJSON); test.toJSON.should.be.instanceof(Function);
      obj = test.toJSON();
      should.exist(obj);
    });

    describe('toJSON', function() {
      it('doesn\'t omit public keys nor the "_id"', function() {
        obj.should.have.property('public');
        obj.should.have.property('_id');
      });

      it('omits the keys prefixed with "_"', function() {
        obj.should.not.have.property('_private');
      });

      it('doesn\'t omit keys with the private field set to false', function() {
        obj.should.have.property('_uber_weird');
      });

      it('omits the keys with the private field set to true', function() {
        obj.should.not.have.property('weird');
        obj.should.not.have.property('mega_uber_weird');
      });

      it('gets implicitly called when strigifying', function() {
        var json = JSON.parse(JSON.stringify(test.toJSON()));
        should.exist(json);

        _.each(['public', '_id', '_uber_weird'], function(k) {
          json.should.have.property(k);
        });

        _.each(['_private', 'weird'], function(k) {
          json.should.not.have.property(k);
        });
      });
    });

    describe('toObject', function() {
      it('works as usual', function() {
        var obj = test.toObject();
        should.exist(obj);

        _.each(_.keys(test._doc), function(key) {
          obj.should.have.property(key);
        });
      });
    });
  });
});

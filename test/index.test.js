'use strict'; /* global describe, it, before */
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var privatePaths = require('..');

var _        = require('lodash'),
    makeStub = require('mocha-make-stub'),
    mongoose = require('mongoose'),
    should   = require('should');

/**
 * Tests
 * --------------------------------------------------------------------------*/

describe('mongoose-private-paths', function() {
  describe('without passing any options', function() {
    var Test, test, obj, NestedModel, nested_test;

    before(function() {
      var TestSchema = new mongoose.Schema({
        public:           { type: String },
        _private:         { type: String },
        weird:            { type: String, private: true },
        _uber_weird:      { type: String, private: false },
        mega_uber_weird: [{ type: String, private: true, default: [] }],
        nested: [new mongoose.Schema({
          public: { type: String },
          passwd: { type: String, private: true }
        }, { _id: false, versionKey: false })],
        nested_single: new mongoose.Schema({
          public: { type: String },
          passwd: { type: String, private: true }
        }, { _id: false, versionKey: false }),
        nested_obj: {
          public: { type: String },
          passwd: { type: String, private: true }
        },
        reference_obj: { type: mongoose.Schema.ObjectId, ref: 'NestedModel' },
        reference_array: [{ type: mongoose.Schema.ObjectId, ref: 'NestedModel' }]
      });

      TestSchema.plugin(privatePaths);
      Test = mongoose.model('Test', TestSchema);

      var NestedModelSchema = new mongoose.Schema({
        _private: { type: String },
        public: { type: String },
      });

      NestedModelSchema.plugin(privatePaths);
      NestedModel = this.NestedModel =
        mongoose.model('NestedModel', NestedModelSchema);

      nested_test = new NestedModel({
        public: 'Name',
        _private: 'password',
      });

      test = new Test({
        public:      'Name',
        _private:    'password',
        weird:       '.jshintrc',
        _uber_weird: '.tmux.conf',
        mega_uber_weird: ['hello', 'world'],
        nested: [{
          public: 'Nested Name',
          passwd: 'Nested password'
        }],
        nested_single: {
            public: 'NestedSingle Name',
            passwd: 'NestedSingle password'
        },
        nested_obj: {
          public: 'NestedObj Name',
          passwd: 'NestedObj password'
        },
        reference_obj: nested_test._id,
        reference_array: [ nested_test._id ]
      });
    });

    it('works with raw type field descriptors', function() {
      var TestRawSchema = new mongoose.Schema({
        public:           String,
        _private:         String,
      });

      TestRawSchema.plugin(privatePaths);
      var TestRaw = mongoose.model('TestRaw', TestRawSchema);
      var obj = new TestRaw({
        public: 'here',
        _private: 'here',
      }).toJSON();
      should.exist(obj);
      obj.should.have.property('public');
      obj.should.not.have.property('_private');
    });

    it('preserves the Model\'s toJSON method', function() {
      should.exist(test.toJSON); test.toJSON.should.be.instanceof(Function);
      obj = test.toJSON();
      should.exist(obj);
    });

    describe('findPrivate(query)', function() {
      it('makes an optimized query only `selecting` public paths', function() {
        var query = Test.findPrivate({ something: 'here' });
        should.exist(query);
        query.should.be.instanceof(mongoose.Query);
        query._fields.should.eql({
          _private: 0,
          weird: 0,
          mega_uber_weird: 0,
          'nested.passwd': 0,
          'nested_obj.passwd': 0,
          'nested_single.passwd': 0
        });
      });
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

      it('omits nested private keys', function() {
        obj.should.have.property('nested');
        obj.nested[0].should.eql({
          public: 'Nested Name'
        });

        obj.should.have.property('nested_obj');
        obj.nested_obj.should.eql({
          public: 'NestedObj Name'
        });

        obj.should.have.property('nested_single');
        obj.nested_single.should.eql({
          public: 'NestedSingle Name'
        });
      });

      it('fully omits empty object nodes', function() {
        var obj = new Test({
          nested: [
            { passwd: 'something' }
          ],
          nested_obj: {
            passwd: 'something'
          }
        });
        var js = obj.toJSON();
        js.should.not.have.property('nested_obj');
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

      it('ignores keys passed as the keep option', function() {
        var obj;
        // when an array of keys is passed.
        obj = test.toJSON({ keep: ['weird', 'mega_uber_weird'] });
        obj.should.have.property('weird');
        obj.should.have.property('mega_uber_weird');
        obj.should.not.have.property('_private');

        // when a single key is passed
        obj = test.toJSON({ keep: 'weird' });
        obj.should.have.property('weird');
        obj.should.not.have.property('mega_uber_weird');
        obj.should.not.have.property('_private');
      });

      it('only removes keys passed as the `remove` option', function() {
        var obj;
        // when an array of keys is passed.
        obj = test.toJSON({ remove: ['weird', 'mega_uber_weird'] });
        obj.should.not.have.property('weird');
        obj.should.not.have.property('mega_uber_weird');
        obj.should.have.property('_private');

        // when a single key is passed
        obj = test.toJSON({ remove: 'weird' });
        obj.should.not.have.property('weird');
        obj.should.have.property('mega_uber_weird');
        obj.should.have.property('_private');
      });

      describe('when populating nested documents', function() {
        makeStub('NestedModel', 'find', function(query, s, o, cb) {
          cb(null, [nested_test]);
        });

        it('omits the nested model\'s private paths', function(done) {
          test.populate(['reference_obj', 'reference_array'], function(err, test) {
            if(err) return done(err);
            var json = test.toJSON();

            json.should.have.property('reference_obj');
            json.reference_obj.should.not.have.property('_private');
            json.reference_obj.should.have.property('public');

            json.should.have.property('reference_array');
            json.reference_array[0].should.not.have.property('_private');
            json.reference_array[0].should.have.property('public');

            done();
          });
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

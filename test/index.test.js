'use strict'; /* global describe, it, before */
/**
 * Dependencies
 * --------------------------------------------------------------------------*/

var privatePaths = require('..');

var mongoose = require('mongoose'),
    should   = require('should');

/**
 * Tests
 * --------------------------------------------------------------------------*/

describe('mongoose-private-paths', function() {
  describe('without passing any options', function() {
    var Test;

    before(function() {
      var TestSchema = new mongoose.Schema({
        public:      { type: String },
        _private:    { type: String },
        weird:       { type: String, private: true },
        _uber_weird: { type: String, private: false },
      });

      TestSchema.plugin(privatePaths);

      Test = mongoose.model('NoOpTest', TestSchema);
    });

    it('privatizes the Model\'s toJSON function', function() {
      var test = new Test({
        public:      'Name',
        _private:    'password',
        weird:       '.jshintrc',
        _uber_weird: '.tmux.conf'
      });
      should.exist(test.toJSON);

      var obj = test.toJSON();
      should.exist(obj);
      obj.should.have.property('public');
      obj.should.have.property('_id');
      obj.should.have.property('_uber_weird');
      obj.should.not.have.property('_private');
      obj.should.not.have.property('weird');

      var json = JSON.parse(JSON.stringify(test.toJSON()));
      should.exist(json);
      json.should.have.property('public');
      json.should.have.property('_id');
      json.should.have.property('_uber_weird');
      json.should.not.have.property('_private');
      json.should.not.have.property('weird');
    });
  });
});

var assert = require('assert');

var noop = function () {};

assert.document = function (document) {
  assert.equal('object', typeof document);
  assert.equal(2, Object.keys(document).length);
  assert.equal('object', typeof document._id);
  assert.equal(24, document._id.toString().length);
  assert.equal(1, document.foo);
};

describe('mongohooks', function () {
  var db, mongohooks;

  beforeEach(function (done) {
    db = require('mongojs')('test', ['mongohooks']);
    mongohooks = require('./index')(db.mongohooks);
    db.mongohooks.remove({}, done);
  });

  describe("#save()", function () {
    it("should be transparent", function (done) {
      mongohooks.save(function (document, next) {
        next();
      });
      db.mongohooks.save({ foo: 1 }, function (err, result) {
        assert.ifError(err);
        assert.document(result);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.save(function (document, next) {
        assert.deepEqual({ foo: 1 }, document);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.save({ foo: 1 });
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.save(function (document, next) {});
      db.mongohooks.save({ foo: 1 }, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.save(function (document, next) {
        next(new Error('foo'));
      });
      db.mongohooks.save({ foo: 1 }, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        db.mongohooks.count(function (err, count) {
          assert.ifError(err);
          assert.equal(0, count);
          done();
        });
      });
    });
  });

  describe("#findOne()", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.find(function (criteria, next) {
        next();
      });
      db.mongohooks.findOne({}, function (err, result) {
        assert.ifError(err);
        assert.document(result);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.find(function (criteria, next) {
        assert.deepEqual({ bar: 1 }, criteria);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.findOne({ bar: 1 }, noop);
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.find(function (criteria, next) {});
      db.mongohooks.findOne({}, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.find(function (criteria, next) {
        next(new Error('foo'));
      });
      db.mongohooks.findOne({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });

  describe("#find()", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.find(function (criteria, next) {
        next();
      });
      db.mongohooks.find({}, function (err, result) {
        assert.ifError(err);
        assert(Array.isArray(result));
        assert.document(result[0]);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.find(function (criteria, next) {
        assert.deepEqual({ bar: 1 }, criteria);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.find({ bar: 1 }, noop);
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.find(function (criteria, next) {});
      db.mongohooks.find({}, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.find(function (criteria, next) {
        next(new Error('foo'));
      });
      db.mongohooks.find({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });

  describe("#document()", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.document(function (document, projection, next) {
        next();
      });
      db.mongohooks.findOne({}, function (err, result) {
        assert.ifError(err);
        assert.document(result);
        done();
      });
    });

    it("should call the after filter", function (done) {
      mongohooks.document(function (document, projection, next) {
        assert.document(document);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.find({ foo: 1 }, noop);
    });

    it("should forward the projection", function (done) {
      mongohooks.document(function (document, projection, next) {
        assert.deepEqual({ bar: 1 }, projection);
        done();
      });
      db.mongohooks.find({ foo: 1 }, { bar: 1 }, noop);
    });

    it("should pass on errors to the final callback", function (done) {
      mongohooks.document(function (document, projection, next) {
        next(new Error('foo'));
      });
      db.mongohooks.find({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });

  describe('#on()', function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it('should call listener for save events', function (done) {
      var cbCount = 2;
      var assertDone = function () {
        if (!--cbCount) done();
      };
      mongohooks.on('save', function (err, result, lastErrorObject, document) {
        assert.ifError(err);
        assert.document(result);
        assert.equal(lastErrorObject.n, 0);
        assert.deepEqual(document, { foo: 1 });
        assertDone();
      });
      db.mongohooks.save({ foo: 1 }, function (err, result) {
        assert.ifError(err);
        assert.document(result);
        assertDone();
      });
    });

    it('should call listener for insert events', function (done) {
      var cbCount = 2;
      var assertDone = function () {
        if (!--cbCount) done();
      };
      mongohooks.on('insert', function (err, result, lastErrorObject, document) {
        assert.ifError(err);
        assert.document(result);
        assert.equal(lastErrorObject.n, 0);
        assert.deepEqual(document, { foo: 1 });
        assertDone();
      });
      db.mongohooks.insert({ foo: 1 }, function (err, result) {
        assert.ifError(err);
        assert.document(result);
        assertDone();
      });
    });

    it('should call listener for update events', function (done) {
      var cbCount = 2;
      var assertDone = function () {
        if (!--cbCount) done();
      };
      mongohooks.on('update', function (err, lastErrorObject, query, update, options) {
        assert.ifError(err);
        assert(lastErrorObject.updatedExisting);
        assert.deepEqual(query, { foo: 1 });
        assert.deepEqual(update, { foo: 1, bar: 1 });
        assert.strictEqual(options, undefined);
        assertDone();
      });
      db.mongohooks.update({ foo: 1 }, { foo: 1, bar: 1 }, function (err, lastErrorObject) {
        assert.ifError(err);
        assert(lastErrorObject.updatedExisting);
        assertDone();
      });
    });
  });
});

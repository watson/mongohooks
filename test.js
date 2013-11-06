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

  describe("#onSave", function () {
    it("should be transparent", function (done) {
      mongohooks.onSave(function (document, next) {
        next();
      });
      db.mongohooks.save({ foo: 1 }, function (err, res) {
        assert.ifError(err);
        assert.document(res);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.onSave(function (document, next) {
        assert.deepEqual({ foo: 1 }, document);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.save({ foo: 1 });
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.onSave(function (document, next) {});
      db.mongohooks.save({ foo: 1 }, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.onSave(function (document, next) {
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

  describe("#onFindOne", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.onFind(function (criteria, next) {
        next();
      });
      db.mongohooks.findOne({}, function (err, res) {
        assert.ifError(err);
        assert.document(res);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.onFind(function (criteria, next) {
        assert.deepEqual({ bar: 1 }, criteria);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.findOne({ bar: 1 }, noop);
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.onFind(function (criteria, next) {});
      db.mongohooks.findOne({}, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.onFind(function (criteria, next) {
        next(new Error('foo'));
      });
      db.mongohooks.findOne({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });

  describe("#onFind", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.onFind(function (criteria, next) {
        next();
      });
      db.mongohooks.find({}, function (err, res) {
        assert.ifError(err);
        assert(Array.isArray(res));
        assert.document(res[0]);
        done();
      });
    });

    it("should call the before filter", function (done) {
      mongohooks.onFind(function (criteria, next) {
        assert.deepEqual({ bar: 1 }, criteria);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.find({ bar: 1 }, noop);
    });

    it("should't complete if the callback ins't called", function (done) {
      mongohooks.onFind(function (criteria, next) {});
      db.mongohooks.find({}, function () {
        throw new Error('Should not call save');
      });
      setTimeout(done, 100);
    });

    it("should be abortable", function (done) {
      mongohooks.onFind(function (criteria, next) {
        next(new Error('foo'));
      });
      db.mongohooks.find({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });

  describe("#onDocument", function () {
    beforeEach(function (done) {
      db.mongohooks.insert({ foo: 1 }, done);
    });

    it("should be transparent", function (done) {
      mongohooks.onDocument(function (document, next) {
        next();
      });
      db.mongohooks.findOne({}, function (err, res) {
        assert.ifError(err);
        assert.document(res);
        done();
      });
    });

    it("should call the after filter", function (done) {
      mongohooks.onDocument(function (document, next) {
        assert.document(document);
        assert.equal('function', typeof next);
        assert.equal(1, next.length);
        done();
      });
      db.mongohooks.find({ foo: 1 }, noop);
    });

    it("should pass on errors to the final callback", function (done) {
      mongohooks.onDocument(function (document, next) {
        next(new Error('foo'));
      });
      db.mongohooks.find({}, function (err) {
        assert(err instanceof Error);
        assert.equal('foo', err.message);
        done();
      });
    });
  });
});

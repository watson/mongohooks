# MongoHooks

A thin before/after filter extension for the
[mongojs](https://github.com/mafintosh/mongojs) node-module.

[![build
status](https://secure.travis-ci.org/watson/mongohooks.png)](http://travis-ci.org/watson/mongohooks)

## Install

```
npm install mongohooks
```

## Usage

```javascript
var db = require('mongojs')('mydb', ['mycollection']);
var mongohooks = require('mongohooks');

// Add a before filter to db.mycollection.save
mongohooks(db.mycollection).onSave(function (document, next) {...});

// Add a before filter to db.mycollection.insert
mongohooks(db.mycollection).onInsert(function (document, next) {...});

// Add a before filter to db.mycollection.update
mongohooks(db.mycollection).onUpdate(function (query, <update>, next) {...});

// Add a before filter to db.mycollection.find
mongohooks(db.mycollection).onFind(function (criteria, <projection>, next) {...});

// Add an after filter to db.mycollection.find and db.mycollection.findOne
// The after filter is called once for each document in a returned result.
mongohooks(db.mycollection).onDocument(function (document, next) {...});

// Filters are async: Call the `next` callback when you are done
mongohooks(db.mycollection).onFind(function (criteria, next) {
  // do stuff
  next();
});

// Before-filters can abort the execution by passing on an error
mongohooks(db.mycollection).onFind(function (criteria, next) {
  next(new Error());
});

// After-filters can also parse on errors
mongohooks(db.mycollection).onDocument(function (document, next) {
  next(new Error());
});

// Filters can be chained and multiple filters of the same type can be added
mongohooks(db.mycollection)
  .onUpdate(function (query, <update>, next) {...})
  .onFind(function (criteria, <projection>, next) {...})
  .onFind(function (criteria, <projection>, next) {...})
  .onDocument(function (document, next) {...});

// Now just use the reqular mongojs API
db.mycollection.find({ ... }, function (err, res) {...});
```

## License

MIT

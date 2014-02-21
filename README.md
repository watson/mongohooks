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
mongohooks(db.mycollection).save(function (document, next) {...});

// Add a before filter to db.mycollection.insert
mongohooks(db.mycollection).insert(function (document, next) {...});

// Add a before filter to db.mycollection.update
mongohooks(db.mycollection).update(function (query, <update>, next) {...});

// Add a before filter to db.mycollection.find
mongohooks(db.mycollection).find(function (criteria, <projection>, next) {...});

// Add an after filter to db.mycollection.find and db.mycollection.findOne
// The after filter is called once for each document in a returned result.
mongohooks(db.mycollection).document(function (document, projection, next) {...});

// Filters are async: Call the `next` callback when you are done
mongohooks(db.mycollection).find(function (criteria, next) {
  // do stuff
  next();
});

// Before-filters can abort the execution by passing on an error
mongohooks(db.mycollection).find(function (criteria, next) {
  next(new Error());
});

// After-filters can also parse on errors
mongohooks(db.mycollection).document(function (document, projection, next) {
  next(new Error());
});

// Use the `this` keyword to access the collection
mongohooks(db.mycollection).update(function (query, update, next) {
  // perform a find before each update
  this.findOne({ foo: 1 }, function (err, result) {
    // do stuff
    next();
  });
});

// Filters can be chained and multiple filters of the same type can be added
mongohooks(db.mycollection)
  .update(function (query, <update>, next) {...})
  .find(function (criteria, <projection>, next) {...})
  .find(function (criteria, <projection>, next) {...})
  .document(function (document, projection, next) {...});

// Now just use the reqular mongojs API
db.mycollection.find({ ... }, function (err, res) {...});
```

## Disclamer

This module was hacked together in a post-drunken state at a [Copenhagen
Node.js Hackathon](http://www.meetup.com/Copenhagen-Node-js-Hackathon/)
[event](http://www.meetup.com/Copenhagen-Node-js-Hackathon/events/142963512/)
in just a few hours. Bugs might exist.

## License

MIT

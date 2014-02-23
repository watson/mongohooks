# MongoHooks

A thin listener and before/after filter extension for the
[mongojs](https://github.com/mafintosh/mongojs) node-module.

[![build
status](https://secure.travis-ci.org/watson/mongohooks.png)](http://travis-ci.org/watson/mongohooks)

## Install

```
npm install mongohooks
```

## Example

```javascript
var db = require('mongojs')('mydb', ['members']); // load mongojs as normal
var mongohooks = require('mongohooks');

// Add a `createdAt` timestamp to all new documents
mongohooks(db.members).save(function (document, next) {
  document.createdAt = new Date();
  next();
});

// Now just use the reqular mongojs API
db.members.save({ name: "Thomas" }, function (error, result) {
  console.log("Created %s at %s", result.name, result.createdAt);
});
```

## Usage

This module will add 3 kinds of hooks to mongojs, each allowing you to add **Before filters**, **After filters**, and **Listeners** to any MongoDB collection.

**Before filters** are injected as middleware and is called before the actual call to the MongoDB database. You can add more than one *before filter* to the same mongojs function, in which case they are called in order. Each filter have access to all the arguments passed to the original mongojs function.

A *before filter* can be used to manipulate for instance a document before it's saved or a query before it's executed.

**After filters** are also injected as middleware and is called after the mongojs function have finished but before the callback given to the mongojs function is called. *After filters* are useful for validating or manipulating returned documents.

As opposed to *before filters*, which are called only once per call to mongojs, *after filters* are called once per document in the result set.

**Listeners** act as simple async monitors. They are similar to *after filters* in that they are called after the MongoDB command have returned, but they do **not** interfere with the normal operation of the MongoDB query and are hence ideal for logging purposes or derived operations. Also, a *listener* have access to both the original arguments sent to mongojs and the returned error and result parsed to the callback.

### Before filters

Hook into `.save()`, `.insert()`, `.update()`, `.find()`, and `.findOne()`:

```javascript
// Add a before filter to db.members.save
mongohooks(db.members).save(function (document, next) {...});

// Add a before filter to db.members.insert
mongohooks(db.members).insert(function (document, next) {...});

// Add a before filter to db.members.update
mongohooks(db.members).update(function (query, <update>, <options>, next) {...});

// Add a before filter to db.members.find and db.members.findOne
mongohooks(db.members).find(function (criteria, <projection>, next) {...});
```

Filters are async, so remember to call the `next` callback when you are done:

```javascript
mongohooks(db.members).find(function (criteria, next) {
  // do stuff
  next();
});
```

*Before filters* can abort the execution by passing on an error:

```javascript
mongohooks(db.members).find(function (criteria, next) {
  next(new Error());
});
```

Use the `this` keyword to access the collection

```javascript
mongohooks(db.members).update(function (query, update, options, next) {
  // perform a find before each update
  this.findOne({ foo: 1 }, function (error, result) {
    // do stuff
    next();
  });
});
```

### After filters

Allows you to monitor or modify documents returned by either `.find()` or `.findOne()`.

The *after filter* is called once for each document in a returned result and have access to both the document and the optional projection used when the query was performed.

```javascript
mongohooks(db.members).document(function (document, projection, next) {...});
```

Filters are async, so remember to call the `next` callback when you are done:

```javascript
mongohooks(db.members).document(function (document, projection, next) {
  // do stuff
  next();
});
```

*After filters* can also parse on errors:

```javascript
mongohooks(db.members).document(function (document, projection, next) {
  next(new Error());
});
```

### Listeners

Mongohooks also acts as an event-emitter, notifying you after calls to either `.save()`, `.insert()` or `.update()`.

Add listeners using the `.on()` function, which takes two arguments: The event to listen to (`save`, `insert` or `update`) and a callback function to call when the event is emitted. The format of the callback function is `callback(error, result, <arg1>, <arg2>, <...>)`.

The first two arguments is always the `error` and `result` normally passed to the mongojs callback, followed by the arguments of the mongojs function that triggerd the event. E.g. if you listen for `update` events, expect 5 arguments in the callback: `error`, `result`, `query`, `update`, and `options`:

```javascript
mongohooks(db.members).on('save', function (error, result, query, update, options) {
  // error   : null (unless something went wrong)
  // result  : { ... } (in case of the save command, this will be a lastErrorObject)
  // query   : { _id: "foo" }
  // update  : { name: "Anders" }
  // options : undefined (since no options object was passed to the update function)
});

// perform the update
db.members.update({ _id: "foo" }, { name: "Anders" });
```

## Chaining

Filters can be chained and multiple filters of the same type can be added

```javascript
mongohooks(db.members)
  .update(function (query, <update>, <options> next) {...})
  .find(function (criteria, <projection>, next) {...})
  .find(function (criteria, <projection>, next) {...})
  .document(function (document, projection, next) {...})
  .on('save', function (err, result, document) {...});
```

## Todo

- Add support for `.remove()` hooks
- Add support for `.findAndModify()` hooks

## Disclamer

This module was originally hacked together in a post-drunken state at a
[Copenhagen Node.js
Hackathon](http://www.meetup.com/Copenhagen-Node-js-Hackathon/)
[event](http://www.meetup.com/Copenhagen-Node-js-Hackathon/events/142963512/)
in just a few hours. Bugs might still exist.

## License

MIT

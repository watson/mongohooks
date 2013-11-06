var noop = function () {};

exports = module.exports = function (collection) {
  var saveFilters = [],
      insertFilters = [],
      updateFilters = [],
      findFilters = [],
      documentFilters = [],
      chainer, injectBeforeFilters, injectBeforeFindFilters, injectAfterFilters;

  chainer = {
    onSave: function (filter) {
      saveFilters.push(filter);
      return chainer;
    },
    onInsert: function (filter) {
      insertFilters.push(filter);
      return chainer;
    },
    onUpdate: function (filter) {
      updateFilters.push(filter);
      return chainer;
    },
    onFind: function (filter) {
      findFilters.push(filter);
      return chainer;
    },
    onDocument: function (filter) {
      documentFilters.push(filter);
      return chainer;
    }
  };

  injectBeforeFilters = function (fn, filters) {
    var stubArgs = [undefined, undefined, undefined];
    return function () {
      var index = 0,
          args = Array.prototype.slice.call(arguments),
          callback = noop,
          next;

      if (typeof args[args.length-1] === 'function')
        callback = args.pop();

      next = function (err) {
        if (err) return callback(err);
        var filter = filters[index++];
        if (!filter) return fn.apply(collection, args.concat(callback));
        filter.apply(null, args
            .concat(stubArgs)
            .slice(0, filter.length-1)
            .concat(next));
      };
      next();
    };
  };

  injectFindFilters = function (fn) {
    var stubArgs = [undefined, undefined, undefined];
    var wrap = function (fn, cursor, args) {
      var projection = args.length >= 2 ? args[1] : {};
      return function (callback) {
        callback = callback || noop;

        // after filters
        var afterFilter = function (err, res) {
          if (err) return callback(err);
          var filterIndex = 0;
          var nextFilter = function (err) {
            if (err) return callback(err);
            var filter = documentFilters[filterIndex++];
            if (!filter) return callback(null, res);
            if (!Array.isArray(res)) return filter(res, projection, nextFilter);
            var docIndex = 0;
            var nextDoc = function (err) {
              if (err) return callback(err);
              var doc = res[docIndex++];
              if (!doc) return nextFilter();
              filter(doc, projection, nextDoc);
            };
            nextDoc();
          };
          nextFilter();
        };

        // before filters
        var index = 0;
        var next = function (err) {
          if (err) return callback(err);
          var filter = findFilters[index++];
          if (!filter) return fn.call(cursor, afterFilter);
          filter.apply(null, args
              .concat(stubArgs)
              .slice(0, filter.length-1)
              .concat(next));
        };
        next();
      };
    };

    return function () {
      var args = Array.prototype.slice.call(arguments),
          callback, cursor;

      if (typeof args[args.length-1] === 'function')
        callback = args.pop();

      cursor = fn.apply(collection, args);
      cursor.next    = wrap(cursor.next, cursor, args);
      cursor.toArray = wrap(cursor.toArray, cursor, args);

      if (callback)
        return cursor.toArray(callback);
      else
        return cursor;
    };
  };

  collection.save   = injectBeforeFilters(collection.save, saveFilters);
  collection.insert = injectBeforeFilters(collection.insert, insertFilters);
  collection.update = injectBeforeFilters(collection.update, updateFilters);
  collection.find   = injectFindFilters(collection.find);

  return chainer;
};

'use strict';

var fs = require('fs');
var {find} = require('lodash-node');
var {promisify} = require('bluebird');
var readFile = promisify(fs.readFile);
var writeFile = promisify(fs.writeFile);

var parseChangelog = require('./parser');
var buildChangelog = require('./builder');

export function parse(content) {
  return new Changelog(parseChangelog(content));
}

export function read(path) {
  path = path || 'CHANGELOG.md';
  return readFile(path, {encoding: 'utf8'})
  .then((content) => {
    return new Changelog(parseChangelog(content));
  });
}

function Changelog({prelude, epilogue, releases}) {
  this.prelude = prelude;
  this.epilogue = epilogue;
  this.releases = releases;
}

Changelog.prototype.write = function(path) {
  path = path || 'CHANGELOG.md';
  return writeFile(path, this.build());
};


Changelog.prototype.build = function() {
  return buildChangelog(this);
};

Changelog.prototype.getRelease = function(version) {
  return find(this.releases, (r) => r.version === version);
};


Changelog.prototype.addUnreleasedChange = function(desc) {
  this.addUnreleased('Changed', desc);
};

Changelog.prototype.addUnreleased = function(type, desc) {
  var unreleased = this.getRelease('Unreleased');
  if (!unreleased) {
    unreleased = { version: 'Unreleased' };
    this.releases.unshift(unreleased);
  }

  var changes = unreleased[type];
  if (!changes) {
    unreleased[type] = changes = [];
  }

  changes.push([desc]);
};

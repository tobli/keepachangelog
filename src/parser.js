'use strict';

import {markdown} from 'markdown';
import {extend, map} from 'lodash-node'
import semver from 'semver';

import {elementText} from './builder'
import {repeat, parseTill, takeTill} from './utils';


var UNRELEASED_RE = /^(unreleased|upcoming)$/i;

export default function parseChangelog(string) {
  var md = markdown.parse(string);
  md.shift();

  var references;
  if (md[0].references) {
    references = md.shift().references;
  } else {
    references = {};
  }
  var prelude = parsePrelude(md);
  var releases = parseReleases(md);
  var epilogue = md;
  return {prelude, releases, epilogue};
}

var parsePrelude = takeTill(isReleaseHeader);

var parseReleases = repeat(parseRelease);

function parseRelease(els) {
  if (!isReleaseHeader(els[0]))
    return null;

  var header = els.shift();
  var titleElement = header[2];
  var title = elementText(titleElement)

  var prelude = parseContent(els);

  var release = extend({
    title: titleElement,
    prelude: prelude,
  }, parseReleaseDetails(title));

  var sections = repeat(sectionParser(3))(els);
  sections.forEach(({title, content}) => {
    release[title] = extractBulletList(content);
  });

  release.epilogue = takeTill(isReleaseHeader)(els);
  return release;
}


function isReleaseHeader(el) {
  if (!isHeaderLevel(el, 2))
    return false;

  let text = elementText(el);
  return ( text.match(/^v?\d+\.\d+\.\d+/) ||
           text.match(UNRELEASED_RE));
}

function parseReleaseDetails(str) {
  if (str.match(UNRELEASED_RE))
    return { version: 'upcoming' };

  var versionMatch = str.match(/^v?(\d+\.\d+\.\d+)/);
  if (!versionMatch)
    return null;

  var version = semver.valid(versionMatch[1]);
  if (!version)
    return null;

  var dateMatch = str.match(/\d\d\d\d-\d\d-\d\d$/);
  var date = (dateMatch && dateMatch[0]) || null;

  return { version, date };
}

var parseContent = parseTill(isHeader);

function sectionParser(level) {
  return function(md) {
    var el = md[0];
    if (!(isHeader(el) && el[1].level === level))
      return;

    md.shift();
    var title = el[2];

    function newSection(el) {
      return isHeader(el) && el[1].level <= level;
    }

    var content = takeTill(newSection)(md);

    return {
      title: title,
      content: content
    };
  };
}

function extractBulletList(md) {
  var list = md[0];
  if (!(list && list[0] === 'bulletlist'))
    return null;

  return map(list.slice(1), function(item) {
    return item.slice(1);
  });
}

function isHeader(el) {
  return el && el[0] === 'header';
}

function isHeaderLevel (el, level) {
  return isHeader(el) && el[1].level === level;
}

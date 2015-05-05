'use strict';

var {map, capitalize} = require('lodash-node');
var semver = require('semver');

/**
 * Create a markdown string from a changelog structure.
 */
export default function renderChangelog(cl) {
  var rendered =
         buildElementList(cl.prelude) + '\n' +
         buildReleases(cl.releases) + '\n' +
         buildElementList(cl.epilogue);
  return rendered.trim() + '\n';
}


function buildElementList(md, sep) {
  sep = sep || '';
  if (md)
    return md.map(buildElement).join(sep);
  else
    return '';
}


/**
 * Build a JsonML element
 *
 * element
 *    = [ tag-name , attributes , element-list ]
 *    | [ tag-name , attributes ]
 *    | [ tag-name , element-list ']
 *    | [ tag-name ]
 *    | string
 *    ;
 */
function buildElement(el) {
  if (typeof el == 'string')
    return el;

  var tagName = el.shift();

  switch (tagName) {
    case 'header':
      return buildHeader(el);
    case 'para':
      return buildPara(el);
    case 'inlinecode':
      return buildAndSurroundElementList('`', el);
    case 'em':
      return buildAndSurroundElementList('*', el);
    case 'link':
      return buildLink(el);
    default:
      throw new Error(`Unknown tag ${tagName}`);
  }
}


function buildLink(el) {
  return `[${el[1]}](${el[0].href})`;
}


function buildHeader(el) {
  var {level} = el.shift();
  var title = buildElementList(el);
  var header = repeat(level, '#');
  return header + ' ' + title + '\n';
}


function buildPara(el) {
  return buildElementList(el) + '\n';
}


function buildAndSurroundElementList (marker, els) {
  return marker + buildElementList(els) + marker;
}


function buildReleases(releases) {
  return map(releases, (release) => {
    var title = buildReleaseTitle(release);
    return buildHeader([{level: 2}, title]) +
           buildVersionLog('Added', release) +
           buildVersionLog('Changed', release) +
           buildVersionLog('Removed', release) +
           buildVersionLog('Deprecated', release) +
           buildVersionLog('Fixed', release) +
           buildVersionLog('Security', release);
  }).join('');
}


function buildReleaseTitle({version, date}) {
  if (version == 'upcoming') {
    return capitalize(version);
  }
  if (!date) {
    return version;
  }
  return version + ' - ' + date;
}

function buildVersionLog(name, release) {
  var log = release[name];
  if (!log)
    return '';

  var header = buildHeader([{level: 3}, name]);
  var list = map(log, (entry) => {
    return '- ' + indent(buildElementList(entry), 2).trim();
  });
  return header + list.join('\n') + '\n\n';
}


function indent(str, width) {
  return map(str.split('\n'), (line) => repeat(width, ' ') + line).join('\n')
}


function repeat(n, x) {
  return map(new Array(n), () => x).join('');
}

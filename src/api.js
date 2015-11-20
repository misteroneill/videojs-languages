import globby from 'globby';
import mkdirp from 'mkdirp';
import path from 'path';

/**
 * Determines if a value is a non-empty string.
 *
 * @private
 * @param  {Mixed} v
 * @return {Boolean}
 */
const nonEmptyStr = v =>
  typeof v === 'string' && /\S/.test(v);

/**
 * Normalize a patterns string/array into an array of non-empty strings,
 * defaulting to ["lang/*.json"].
 *
 * @private
 * @param  {Array|String} patterns
 * @return {Array}
 */
const normalizePatterns = patterns => {

  // Normalize valid, non-empty string arguments into an array.
  if (nonEmptyStr(patterns)) {
    return [patterns];
  }

  // Default to the "lang" dir in the cwd in the case of invalid or an
  // effectively empty patterns array.
  if (!Array.isArray(patterns) || !patterns.some(nonEmptyStr)) {
    return ['lang/*.json'];
  }

  return patterns.filter(nonEmptyStr);
};

/**
 * Normalize a directory by verifying that it exists - or returning null.
 *
 * @private
 * @param  {String} [dir]
 * @return {String|null}
 */
const normalizeDir = dir => {
  if (nonEmptyStr(dir)) {
    try {

      // mkdirp will do nothing if the directory exists or it will create
      // it if it does not. The only reason it should fail is if the
      // Node process can't write to the path for whatever reason. In that
      // case, we catch and treat the dir as invalid (null).
      mkdirp.sync(dir);
      return dir;
    } catch (x) {}
  }
  return null;
};

/**
 * Takes an array of source .json files and an optional destination
 * directory and returns an array of destination .js files.
 *
 * @private
 * @param  {String} src
 * @param  {String|null} dir
 * @return {String}
 *         The path to the destination .js file.
 */
const destination = (src, dir) => {
  let d = dir || path.dirname(src);
  let bn = path.basename(src);

  // We can assume the basename ends in ".json", so we only need to pop
  // off the "on" to get the proper extension.
  return path.join(d, bn.substr(0, bn.length - 2));
};

/**
 * Takes an array of patterns and returns an array of matching .json
 * filenames.
 *
 * @private
 * @param  {Array} patterns
 * @return {Array}
 */
const findSources = patterns =>
  globby.sync(patterns).filter(f => path.extname(f) === '.json');

/**
 * Process an array of source .json files into an optional dir, output
 * as .js files.
 *
 * @private
 * @param  {Array} srces
 * @param  {String|null} dir
 * @return {Array}
 */
const processSources = (srces, dir) =>
  srces.map(src => {
    let dest = destination(src);
    return dest;
  });

/**
 * Convert any number of target files or directories (filtering down to
 * only `.json`) into executable `.js` files.
 *
 * @param  {Array|String} patterns
 *         One or more `minimatch` patterns.
 *
 * @param  {String} [dir]
 *         A directory, relative to cwd, into which converted files will be
 *         placed. If the directory does not exist, an attempt will be made
 *         to create it. If not provided or creation fails, converted .js
 *         files will be placed alongside their .json sources.
 *
 * @return {Promise}
 *         A promise which resolves with the paths that were converted.
 */
export const convert = (patterns, dir) => {
  let srces = findSources(normalizePatterns(patterns));
  let dests = processSources(srces, normalizeDir(dir));
  return {srces, dests};
};

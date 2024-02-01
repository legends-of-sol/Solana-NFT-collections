/**
 * Cleans a name by removing anything after and including '#' and trims whitespace from the end.
 * @param {string} name - The name to clean.
 * @return {string} The cleaned name.
 */
function cleanName(name) {
  return name.split('#')[0].trim();
}

module.exports = { cleanName };
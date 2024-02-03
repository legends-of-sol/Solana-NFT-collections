const csvParser = require("csv-parser");
const fs = require("fs");

/**
 * Cleans a name by removing anything after and including '#' and trims whitespace from the end.
 * @param {string} name - The name to clean.
 * @return {string} The cleaned name.
 */
function cleanName(name) {
  return name.split("#")[0].trim();
}

function calculateOwnerCounts(results) {
  return results.reduce((acc, item) => {
    acc[item.ownership.owner] = (acc[item.ownership.owner] || 0) + 1;
    return acc;
  }, {});
}

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

async function getMostRecentFile(dirPath) {
  const files = await fs.promises.readdir(dirPath);
  const csvFiles = files.filter(
    (file) => file.startsWith("unique") && file.endsWith(".csv")
  );
  const sortedByDate = csvFiles.sort((a, b) => {
    const dateA = a.match(/\d{8}/)[0];
    const dateB = b.match(/\d{8}/)[0];
    return dateB.localeCompare(dateA);
  });
  return sortedByDate[0];
}

module.exports = {
  cleanName,
  calculateOwnerCounts,
  readCSV,
  getMostRecentFile,
};

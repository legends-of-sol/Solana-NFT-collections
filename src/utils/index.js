const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

/**
 * Cleans a name by removing anything after and including '#' and trims whitespace from the end.
 * @param {string} name - The name to clean.
 * @return {string} The cleaned name.
 */
function cleanName(name) {
  return name ? name.split("#")[0].trim() : name;
}

function calculateOwnerCounts(results) {
  return results.reduce((acc, item) => {
    acc[item.ownership.owner] = (acc[item.ownership.owner] || 0) + 1;
    return acc;
  }, {});
}

async function getMostRecentFile(dirPath) {
  const directories = await fs.promises.readdir(dirPath, {
    withFileTypes: true,
  });
  const sortedDirs = directories
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => b.localeCompare(a));

  if (sortedDirs.length === 0) return null;

  const latestDir = sortedDirs[0];
  const latestDirPath = path.join(dirPath, latestDir);
  const files = await fs.promises.readdir(latestDirPath);
  const csvFiles = files.filter(
    (file) => file.startsWith("unique") && file.endsWith(".csv")
  );

  if (csvFiles.length === 0) return null;

  return path.join(latestDirPath, csvFiles[0]);
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

function calculateGiniCoefficient(numbers) {
  numbers = numbers.sort((a, b) => a - b);
  const n = numbers.length;
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * numbers[i];
  }
  const denominator = n * numbers.reduce((acc, val) => acc + val, 0);
  return numerator / denominator;
}

const latestDateDir = (dir) => fs
  .readdirSync(dir)
  .filter((file) => fs.statSync(path.join(dir, file)).isDirectory())
  .sort()
  .pop();

module.exports = {
  cleanName,
  calculateOwnerCounts,
  getMostRecentFile,
  readCSV,
  calculateGiniCoefficient,
  latestDateDir,
};

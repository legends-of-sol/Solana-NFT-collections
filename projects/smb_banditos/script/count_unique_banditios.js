const fs = require('fs');
const path = require('path');

// Paths to the JSON files
const jsonFilePathGen2 = path.join(__dirname, 'banditos_gen2.json');
const jsonFilePathGen3 = path.join(__dirname, 'banditos_gen3.json');
// Output CSV file path
const csvFilePath = path.join(__dirname, 'unique_banditos_count.csv');

function countNFTs(jsonData, ownerCounts) {
  // Count NFTs for each owner
  jsonData.forEach(item => {
    const ownerId = item.id;
    const nftCount = item.nfts.length;
    if (ownerCounts[ownerId]) {
      ownerCounts[ownerId] += nftCount;
    } else {
      ownerCounts[ownerId] = nftCount;
    }
  });
}

function writeCSV(ownerCounts) {
  // Prepare CSV content
  let csvContent = 'owner,count\n';

  // Convert ownerCounts to an array, sort by count in descending order, then iterate
  const sortedOwnerCounts = Object.entries(ownerCounts).sort((a, b) => b[1] - a[1]);
  for (const [owner, count] of sortedOwnerCounts) {
    csvContent += `${owner},${count}\n`;
  }

  // Generate timestamp
  const date = new Date();
  const formattedDate = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format

  // Create a date-stamped folder
  const dateStampedFolderPath = path.join(__dirname, formattedDate);
  if (!fs.existsSync(dateStampedFolderPath)){
    fs.mkdirSync(dateStampedFolderPath);
  }

  // Update the path for the CSV file to be within the new folder
  const timestampedCsvFilePath = path.join(dateStampedFolderPath, `unique_banditos_count_${formattedDate}.csv`);

  // Write CSV file with timestamp in the filename
  fs.writeFile(timestampedCsvFilePath, csvContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing the CSV file:', err);
      return;
    }
    console.log('CSV file has been saved successfully in the date-stamped folder.');
  });
}

function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject('Error reading the JSON file:', err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

async function main() {
  try {
    const ownerCounts = {};
    const jsonDataGen2 = await readJSONFile(jsonFilePathGen2);
    const jsonDataGen3 = await readJSONFile(jsonFilePathGen3);

    countNFTs(jsonDataGen2, ownerCounts);
    countNFTs(jsonDataGen3, ownerCounts);

    writeCSV(ownerCounts);
  } catch (error) {
    console.error(error);
  }
}

main();
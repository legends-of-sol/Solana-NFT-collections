const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const { execSync } = require("child_process");
const { cleanName, calculateOwnerCounts } = require("./utils");
require("colors");

const Paths = {
  META_DIR: (project_name) => path.join(__dirname, `../NFTs/${project_name}`),
  DIR: (project_name, dateStamp) =>
    path.join(__dirname, `../NFTs/${project_name}/${dateStamp}`),
  COLLECTIONS: path.join(__dirname, "../legends/legends_partners.json"),
  COMMON_ADDRESSES: path.join(__dirname, "../common_addresses.json"),
  NFTS: path.join(__dirname, "../NFTs"),
  README: path.join(__dirname, "../README.md"),
  LEGENDS: path.join(__dirname, "../legends/legends_partners.json"),
  UNCONFIRMED: path.join(__dirname, "../legends/unconfirmed.json"),
  LEGENDS_WEIGHT: path.join(__dirname, "../legends/legends_weight.json"),
  LEGENDS_PARTNERS: path.join(__dirname, "../legends/legends_partners.json"),
};

program
  .command("snapshot <project_name> <collection_address>")
  .description("Take a snapshot of a project")
  .option(
    "-r, --rpc [RPC]",
    "RPC endpoint URL",
    "https://api.mainnet-beta.solana.com"
  )
  .action(async (project_name, collection_address, options) => {
    const RPC = options.rpc;
    const getAssetsByGroup = async () => {
      console.time("getAssetsByGroup"); // Start the timer
      let page = 1;
      let assetList = [];

      while (page) {
        const response = await fetch(RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByGroup",
            params: {
              groupKey: "collection",
              groupValue: collection_address,
              page: page,
              limit: 1000,
            },
          }),
        });
        const { result } = await response.json();

        assetList.push(...result.items);
        if (result.total !== 1000) {
          page = false;
        } else {
          page++;
        }
      }

      const getCollectionAsset = async () => {
        const response = await fetch(RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAsset",
            params: {
              id: collection_address,
            },
          }),
        });
        const { result } = await response.json();
        return result;
      };
      const collectionData = await getCollectionAsset();

      const resultData = {
        totalResults: assetList.length,
        results: assetList,
      };
      const dateStamp = dayjs().format("YYYYMMDD");
      const metaDirPath = Paths.META_DIR(project_name);
      const dirPath = Paths.DIR(project_name, dateStamp);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const metaContent = {
        collectionKey: collection_address,
        name: collectionData?.content?.metadata?.name
          ? cleanName(collectionData?.content?.metadata?.name)
          : project_name,
        image:
          collectionData?.content?.links.image ||
          resultData.results[0].content.links.image ||
          "",
        description: collectionData?.content?.metadata.description ?? "",
        url:
          collectionData?.content?.links.external_url ||
          resultData.results[0].content.links.external_url ||
          "",
        token_standard:
          resultData.results[0].content.metadata.token_standard ?? "",
      };
      fs.writeFileSync(
        `${metaDirPath}/${project_name}_meta.json`,
        JSON.stringify(metaContent, null, 2)
      );

      // Generate CSV content
      const csvContent = resultData.results
        .map((item) => `${item.ownership.owner},${item.id}`)
        .join("\n");
      fs.writeFileSync(
        `${dirPath}/${project_name}_${dateStamp}.csv`,
        `owner,nftmint\n${csvContent}`
      );

      // Generate JSON content
      const jsonContent = resultData.results.map((item) => ({
        NFTAddress: item.id,
        ownerAddress: item.ownership.owner,
      }));
      fs.writeFileSync(
        `${dirPath}/${project_name}_${dateStamp}.json`,
        JSON.stringify(jsonContent, null, 2)
      );

      // Generate Hashlist JSON
      const hashlistContent = resultData.results.map((item) => item.id);
      fs.writeFileSync(
        `${dirPath}/${project_name}_hashlist_${dateStamp}.json`,
        JSON.stringify(hashlistContent, null, 2)
      );

      // Generate Unique Owners CSV with count
      const ownerCounts = calculateOwnerCounts(resultData.results);
      const sortedOwnerCounts = Object.entries(ownerCounts).sort(
        (a, b) => b[1] - a[1]
      );
      const uniqueOwnersCSV = sortedOwnerCounts
        .map(([owner, count]) => `${owner},${count}`)
        .join("\n");

      fs.writeFileSync(
        `${dirPath}/unique_${project_name}_owners_${dateStamp}.csv`,
        `owner,count\n${uniqueOwnersCSV}`
      );

      console.log(`Snapshot successfully taken for -- ${project_name}`);
      console.timeEnd("getAssetsByGroup");
    };
    await getAssetsByGroup();
  });

program
  .command("creator_snapshot <project_name> <creator_address>")
  .description("Take a snapshot of projects by creator")
  .option(
    "-r, --rpc [RPC]",
    "RPC endpoint URL",
    "https://api.mainnet-beta.solana.com"
  )
  .action(async (project_name, creator_address, options) => {
    const RPC = options.rpc;
    const getAssetsByGroup = async () => {
      console.time("getAssetsByGroup"); // Start the timer
      let page = 1;
      let assetList = [];

      while (page) {
        const response = await fetch(RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "my-id",
            method: "getAssetsByCreator",
            params: {
              creatorAddress: creator_address,
              onlyVerified: true,
              page,
              limit: 1000,
            },
          }),
        });
        const { result } = await response.json();

        assetList.push(...result.items);
        if (result.total !== 1000) {
          page = false;
        } else {
          page++;
        }
      }

      const resultData = {
        totalResults: assetList.length,
        results: assetList,
      };
      const dateStamp = dayjs().format("YYYYMMDD");
      const metaDirPath = Paths.META_DIR(project_name);
      const dirPath = Paths.DIR(project_name, dateStamp);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const metaContent = {
        creatorAddress: creator_address,
        name:
          cleanName(resultData.results[0].content.metadata.name) ??
          project_name,
        image: resultData.results[0].content.links.image || "",
        description: resultData.results[0].content.metadata.description ?? "",
        url: resultData.results[0].content.links.external_url || "",
        token_standard:
          resultData.results[0].content.metadata.token_standard ?? "",
      };
      fs.writeFileSync(
        `${metaDirPath}/${project_name}_meta.json`,
        JSON.stringify(metaContent, null, 2)
      );

      // Generate CSV content
      const csvContent = resultData.results
        .map((item) => `${item.ownership.owner},${item.id}`)
        .join("\n");
      fs.writeFileSync(
        `${dirPath}/${project_name}_${dateStamp}.csv`,
        `owner,nftmint\n${csvContent}`
      );

      // Generate JSON content
      const jsonContent = resultData.results.map((item) => ({
        NFTAddress: item.id,
        ownerAddress: item.ownership.owner,
      }));
      fs.writeFileSync(
        `${dirPath}/${project_name}_${dateStamp}.json`,
        JSON.stringify(jsonContent, null, 2)
      );

      // Generate Hashlist JSON
      const hashlistContent = resultData.results.map((item) => item.id);
      fs.writeFileSync(
        `${dirPath}/${project_name}_hashlist_${dateStamp}.json`,
        JSON.stringify(hashlistContent, null, 2)
      );

      // Unique owners CSV with count
      const ownerCounts = calculateOwnerCounts(resultData.results);
      const sortedOwnerCounts = Object.entries(ownerCounts).sort(
        (a, b) => b[1] - a[1]
      );
      const uniqueOwnersCSV = sortedOwnerCounts
        .map(([owner, count]) => `${owner},${count}`)
        .join("\n");
      fs.writeFileSync(
        `${dirPath}/unique_${project_name}_owners_${dateStamp}.csv`,
        `owner,count\n${uniqueOwnersCSV}`
      );

      console.log(`Snapshot successfully taken for -- ${project_name}`);
      console.timeEnd("getAssetsByGroup");
    };
    await getAssetsByGroup();
  });

program
  .command("snapshot_all_legends")
  .description(
    "Cycle through all collections in legends_collections.json and take a snapshot of each"
  )
  .option(
    "-r, --rpc [RPC]",
    "RPC endpoint URL",
    "https://api.mainnet-beta.solana.com"
  )
  .action((options) => {
    const collections = JSON.parse(
      fs.readFileSync(Paths.LEGENDS_PARTNERS, "utf8")
    );
    const RPC = options.rpc;

    collections.forEach((collection) => {
      console.log(`Taking snapshot for: ${collection.name}`);
      try {
        // Determine the command based on the presence of collectionKey or creatorAddress
        const command = collection.collectionKey
          ? `npm run snapshot "${collection.name}" "${collection.collectionKey}" -r "${RPC}"`
          : `npm run snapshot:creator "${collection.name}" "${collection.creatorAddress}" -r "${RPC}"`;

        execSync(command, { stdio: "inherit" });
      } catch (error) {
        console.error(`Failed to take snapshot for: ${collection.name}`, error);
      }
    });

    console.log("Completed cycling through all collections.");
  });

program
  .command("update_readme")
  .description("Update the README.md file with a list of projects")
  .action(() => {
    const projects = fs.readdirSync(Paths.NFTS);

    let projectsList = projects
      .map((project) => {
        const metaPath = path.join(Paths.NFTS, project, `${project}_meta.json`);
        if (fs.existsSync(metaPath)) {
          const metaData = JSON.parse(fs.readFileSync(metaPath, "utf8"));
          const projectEntry =
            `- ${cleanName(metaData.name)}` +
            (metaData.url ? ` - ${metaData.url}` : "") +
            `\n`;
          return projectEntry;
        }
        return null;
      })
      .filter(Boolean)
      .join("");

    let readmeContent = fs.readFileSync(Paths.README, "utf8");
    const projectsSectionStart = readmeContent.indexOf("## Project Hashlists");
    let projectsSectionEnd = readmeContent.indexOf(
      "##",
      projectsSectionStart + 1
    );

    // Adjust the end index to capture until the next section or end of file if no next section exists
    projectsSectionEnd =
      projectsSectionEnd !== -1 ? projectsSectionEnd : readmeContent.length;

    if (projectsSectionStart !== -1) {
      const beforeProjects = readmeContent.substring(0, projectsSectionStart);
      const afterProjects = readmeContent.substring(projectsSectionEnd);
      // Ensure a newline is added before the "## Structure of the Repository" section
      readmeContent = `${beforeProjects}## Project Hashlists\n\n${projectsList}\n${afterProjects}`;
    } else {
      // If the "## Project Hashlists" section does not exist, append it at the desired location
      // Ensure to add a newline character at the end for proper spacing
      readmeContent += `\n## Project Hashlists\n\n${projectsList}\n`;
    }

    fs.writeFileSync(Paths.README, readmeContent);
    console.log("README.md updated with the latest projects list.");
  });

program
  .command("update_legends")
  .description(
    "Update legends_partners.json with data from NFTs folders, excluding unconfirmed collections"
  )
  .action(() => {
    const nftsPath = path.join(__dirname, "../NFTs");
    const legendsPath = path.join(
      __dirname,
      "../legends/legends_partners.json"
    );
    const unconfirmedPath = path.join(__dirname, "../legends/unconfirmed.json");
    const folders = fs.readdirSync(nftsPath);

    // Load unconfirmed collections
    const unconfirmedCollections = JSON.parse(
      fs.readFileSync(unconfirmedPath, "utf8")
    ).map((item) => item.name);

    const updatedLegends = folders
      .map((folder) => {
        if (unconfirmedCollections.includes(folder)) {
          return null; // Skip unconfirmed collections
        }
        const metaPath = path.join(nftsPath, folder, `${folder}_meta.json`);
        if (fs.existsSync(metaPath)) {
          const metaData = JSON.parse(fs.readFileSync(metaPath, "utf8"));
          return {
            name: folder,
            ...(metaData.collectionKey
              ? { collectionKey: metaData.collectionKey }
              : {}),
            ...(metaData.creatorAddress
              ? { creatorAddress: metaData.creatorAddress }
              : {}),
          };
        }
        return null;
      })
      .filter(Boolean);

    fs.writeFileSync(legendsPath, JSON.stringify(updatedLegends, null, 2));
    console.log(
      "legends_partners.json updated successfully, excluding unconfirmed collections."
    );
  });

program
  .command("update_legends_weight")
  .description(
    "Update legends_weight.json with counts of NFTs per owner per project"
  )
  .option(
    "-p, --projects <projects>",
    "A comma-separated list of project names to update",
    (value) => value.split(",")
  )
  .action((options) => {
    const nftsPath = path.join(__dirname, "../NFTs");
    const legendsWeightPath = path.join(
      __dirname,
      "../legends/legends_weight.json"
    );
    if (!fs.existsSync(legendsWeightPath)) {
      fs.writeFileSync(legendsWeightPath, JSON.stringify([], null, 2));
    }
    const legendsPartnersPath = path.join(
      __dirname,
      "../legends/legends_partners.json"
    );
    const projectsToUpdate = options.projects || [];
    const legendsPartners = JSON.parse(
      fs.readFileSync(legendsPartnersPath, "utf8")
    );
    const filteredProjects = legendsPartners
      .filter(
        (partner) =>
          projectsToUpdate.length === 0 ||
          projectsToUpdate.includes(partner.name)
      )
      .map((partner) => partner.name);

    let legendsWeight = [];
    if (fs.existsSync(legendsWeightPath)) {
      legendsWeight = JSON.parse(fs.readFileSync(legendsWeightPath, "utf8"));
    }

    const projects = fs
      .readdirSync(nftsPath)
      .filter(
        (project) =>
          filteredProjects.includes(project) && project !== "alldomains"
      );

    projects.forEach((project) => {
      const projectPath = path.join(nftsPath, project);
      const snapshotFolders = fs
        .readdirSync(projectPath)
        .filter((folder) => /^\d{8}$/.test(folder));
      if (snapshotFolders.length > 0) {
        const mostRecentSnapshot = snapshotFolders.sort().pop();
        const snapshotPath = path.join(projectPath, mostRecentSnapshot);
        const uniqueOwnersFile = fs
          .readdirSync(snapshotPath)
          .find((file) => file.startsWith("unique") && file.endsWith(".csv"));
        if (uniqueOwnersFile) {
          const uniqueOwnersFilePath = path.join(
            snapshotPath,
            uniqueOwnersFile
          );
          const uniqueOwnersData = fs
            .readFileSync(uniqueOwnersFilePath, "utf8")
            .split("\n")
            .slice(1);
          uniqueOwnersData.forEach((row) => {
            const [owner, count] = row.split(",");
            let ownerEntry = legendsWeight.find((entry) => entry.id === owner);
            if (!ownerEntry) {
              ownerEntry = { id: owner };
              legendsWeight.push(ownerEntry);
            }
            ownerEntry[project] = parseInt(count, 10);
          });
        }
      }
    });

    fs.writeFileSync(legendsWeightPath, JSON.stringify(legendsWeight, null, 2));
    console.log("legends_weight.json updated successfully.");
  });

program
  .command("count_legends")
  .description(
    "Count the occurrences of unique legends in legends_weight.json and total the id keys"
  )
  .action(() => {
    const legendsWeightData = JSON.parse(
      fs.readFileSync(Paths.LEGENDS_WEIGHT, "utf8")
    );

    const legendsCount = legendsWeightData.reduce((acc, entry) => {
      Object.keys(entry).forEach((key) => {
        if (key !== "id") {
          acc[key] = (acc[key] || 0) + 1;
        } else {
          acc.totalIds = (acc.totalIds || 0) + 1;
        }
      });
      return acc;
    }, {});

    const maxLegendNameLength = Math.max(
      ...Object.keys(legendsCount).map((key) => key.length),
      "Legend".length,
      "Total IDs".length
    );
    const maxCountLength = Math.max(
      ...Object.values(legendsCount).map((value) => value.toString().length),
      "Count".length
    );
    const legendColumnWidth = maxLegendNameLength + 2;
    const countColumnWidth = maxCountLength + 2;

    console.log(
      `| Legend${" ".repeat(
        legendColumnWidth - "Legend".length
      )} | Count${" ".repeat(countColumnWidth - "Count".length)}|`.blue
    );
    console.log(
      `|-${"-".repeat(legendColumnWidth)}-|-${"-".repeat(countColumnWidth)}|`
        .red
    );

    Object.entries(legendsCount).forEach(([key, value]) => {
      if (key !== "totalIds") {
        const legendPadding = legendColumnWidth - key.length;
        const countPadding = countColumnWidth - value.toString().length;
        console.log(
          `| ${key}${" ".repeat(legendPadding)} | ${value}${" ".repeat(
            countPadding
          )} |`
        );
      }
    });

    // Separator row before "Total IDs"
    console.log(
      `|-${"-".repeat(legendColumnWidth)}-|-${"-".repeat(countColumnWidth)}|`
        .red
    );

    // Adjust padding for "Total IDs" dynamically based on column width
    const totalIdsPadding = legendColumnWidth - "Total IDs".length;
    const totalCountPadding =
      countColumnWidth - legendsCount.totalIds.toString().length;
    console.log(
      `| Total IDs${" ".repeat(totalIdsPadding)} | ${
        legendsCount.totalIds
      }${" ".repeat(totalCountPadding)} |`
    );
  });

  program
  .command("filter_mp")
  .description("Filter out matching addresses from common_addresses.json based on ids in legends_weight.json")
  .action(() => {
    const outputPath = path.join(__dirname, `../legends/mp_${dayjs().format('YYYYMMDD')}.json`);

    const legendsWeight = JSON.parse(fs.readFileSync(Paths.LEGENDS_WEIGHT, 'utf8'));
    const commonAddresses = JSON.parse(fs.readFileSync(Paths.COMMON_ADDRESSES, 'utf8'));

    const ids = new Set(commonAddresses.map(mp => mp.address));

    // Filter out legends that are in the common addresses
    const filteredLegendsWeight = legendsWeight.filter(legend => ids.has(legend.id));
    const updatedLegendsWeight = legendsWeight.filter(legend => !ids.has(legend.id));

    // Write the filtered legends weight to a new file
    fs.writeFileSync(outputPath, JSON.stringify(filteredLegendsWeight, null, 2));
    fs.writeFileSync(Paths.LEGENDS_WEIGHT, JSON.stringify(updatedLegendsWeight, null, 2));

    console.log(`Filtered legends weight written to ${outputPath}`);
  });

program.parse(process.argv);

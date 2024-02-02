const { program } = require("commander");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
const { execSync } = require("child_process");
const { cleanName, calculateOwnerCounts } = require("./utils");

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
      const metaDirPath = path.join(__dirname, `../NFTs/${project_name}`);
      const dirPath = path.join(
        __dirname,
        `../NFTs/${project_name}/${dateStamp}`
      );
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
      const metaDirPath = path.join(__dirname, `../NFTs/${project_name}`);
      const dirPath = path.join(
        __dirname,
        `../NFTs/${project_name}/${dateStamp}`
      );
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
  .action(() => {
    const collectionsPath = path.join(__dirname, "../legends_partners.json");
    const collections = JSON.parse(fs.readFileSync(collectionsPath, "utf8"));

    collections.forEach((collection) => {
      console.log(`Taking snapshot for: ${collection.name}`);
      try {
        execSync(
          `npm run snapshot "${collection.name}" "${collection.collectionKey}"`,
          { stdio: "inherit" }
        );
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
    const nftsPath = path.join(__dirname, "../NFTs");
    const readmePath = path.join(__dirname, "../README.md");
    const projects = fs.readdirSync(nftsPath);

    let projectsList = projects
      .map((project) => {
        const metaPath = path.join(nftsPath, project, `${project}_meta.json`);
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

    let readmeContent = fs.readFileSync(readmePath, "utf8");
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

    fs.writeFileSync(readmePath, readmeContent);
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
      fs.writeFileSync(legendsWeightPath, JSON.stringify({}, null, 2));
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

    let legendsWeight = {};
    if (fs.existsSync(legendsWeightPath)) {
      legendsWeight = JSON.parse(fs.readFileSync(legendsWeightPath, "utf8"));
    }

    const projects = fs
      .readdirSync(nftsPath)
      .filter((project) => filteredProjects.includes(project));

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
            if (!legendsWeight[owner]) {
              legendsWeight[owner] = {};
            }
            legendsWeight[owner][project] = parseInt(count, 10);
          });
        }
      }
    });

    fs.writeFileSync(legendsWeightPath, JSON.stringify(legendsWeight, null, 2));
    console.log("legends_weight.json updated successfully.");
  });

program.parse(process.argv);

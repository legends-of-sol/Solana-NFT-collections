const { program } = require("commander");
const fs = require("fs");
const path = require("path");

program
  .command("snapshot <project_name> <collection_address> [RPC]")
  .description("Take a snapshot of a project")
  .action(async (project_name, collection_address, RPC) => {
    RPC = RPC || "https://api.mainnet-beta.solana.com";
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
      const resultData = {
        totalResults: assetList.length,
        results: assetList,
      };
      const dirPath = path.join(__dirname, `../NFTs/${project_name}`);
      const filePath = path.join(dirPath, `${project_name}_hashlist.json`);

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(resultData, null, 2), "utf-8");
      console.log(`Data saved to ${filePath}`);
      console.log(`${project_name} Assets:`, resultData);
      console.timeEnd("getAssetsByGroup");
    };
    await getAssetsByGroup();
  });

program.parse(process.argv);

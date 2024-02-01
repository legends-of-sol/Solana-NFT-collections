const { program } = require("commander");

program
  .command("snapshot <project_name> <collection_address> [RPC]")
  .description("Take a snapshot of a project")
  .action(
    (
      project_name,
      collection_address,
      RPC
    ) => {
      RPC = RPC || "https://api.mainnet-beta.solana.com";
      console.log(`Taking snapshot for project: ${project_name}`);
      console.log(`RPC: ${RPC}`);
      console.log(`Collection Address: ${collection_address}`);
    }
  );

program.parse(process.argv);
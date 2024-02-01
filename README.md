# Solana NFT Collections

The home of snapshots for the Legends of Solana. When you know you know.

This repository is a collection of snapshots for various NFT projects on the Solana blockchain. Each snapshot is a JSON file that contains the addresses of the NFTs and their owners. For your NFT project to be submitted to the repository be sure to generate a snapshot which follows the format from https://www.helius.dev/blog/nft-holder-snapshots.

## Structure of the Repository

The repository is structured as follows:

- The `NFTs/` directory contains folders for each NFT project. Each folder is named after the project it represents.
- Inside each project's folder, there are JSON files named in the format `{project_YYMMDD}.json`. These files are the snapshots for the project.

## Adding New Snapshots to the Collection

To add a new snapshot to the collection, follow these steps:

1. Fork this repository and run `npm install` to install the dependencies.
2. Snakecase the name of the project in your mind palace eg. `Legends of Solana` becomes `legends_of_solana`
3. Get the collection address:

![Collection Address](./assets/collection-address.png)

4. Run `npm run snapshot {collection_address} {project_name}` to generate a snapshot
5. Open a PR with the new snapshot

## Example PR

A good example of a PR can be seen here with complete data formats for NFT projects:

[Example PR](https://github.com/Legends-of-Sol/Solana-NFT-collections/pull/3)

## Contributing

We welcome contributions from the community. If you have a new snapshot to add or an update to an existing one, please submit a PR. If you have any questions or need help, feel free to open an issue.

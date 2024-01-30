# Solana NFT Collections
The home of snapshots for the Legends of Solana. When you know you know.

# Adding New Snapshots to the Collection
For your NFT project to be submitted to the repository be sure to generate a snapshot which follows the format from https://www.helius.dev/blog/nft-holder-snapshots.

```json
[
    {
        "NFTAddress": "...",
        "ownerAddress": "..."
    },
]
```

1. Create a new folder if yours does not exist yet in the `NFTs/` directory.

```
/NFTs/{project}
```

2. Within the directory include the {name of your project}_{date}.json (`name_YYYYMMDD.json`) for ease of access.

```
/NFTs/{project}/{project_YYMMDD}.json
```

3. Submit PR `include {project_name}` with the above and formatted correctly for consideration for inclusion.

NOTE: You can include a script for how you generated the list for external verification or link to your methodology. You can also include other data and format types as you wish.

## Example PR

A good example of a PR can be seen here with complete data formats for NFT projects:

https://github.com/Legends-of-Sol/Solana-NFT-collections/pull/3

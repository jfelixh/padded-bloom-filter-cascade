# padded-bloom-filter-cascade
An implementation of a Bloom Filter Cascade with padding. This project is built using TypeScript and relies on npm packages, including a forked version of the bloomfilter library *bloomfilter-sha256*, which is included as a submodule.

## Installing Dependencies

To set up the project, you need to install the required npm packages. Run the following command in the project root directory:
```
npm install
```
## Cloning the submodule
Navigate to the bloomfilter-sha256 directory and clone the bloomfilter submodule, which uses SHA-256 as the hash function with this command in terminal.```
```
cd bloomfilter-sha256
git clone https://github.com/chan9908181/bloomfilter.js.git .
```

## Testing the Implementation Bloom Filter

To verify that the Bloom Filter implementation works correctly, run the following command in the root directory:
```
npm test
```

# padded-bloom-filter-cascade

This project implements a padded Bloom Filter Cascade, based on the [*bloomfilter-sha256*](https://github.com/jfelixh/bloomfilter-sha256) library. It provides utility functions to construct, reconstruct, and verify the presence of elements within the Bloom Filter Cascade.

## Usage
```typescript
import { constructBFC, fromDataHexString, isInBFC, toDataHexString } from 'padded-bloom-filter-cascade';

const element: string = '...'; // Element to check later on if it is in the Bloom Filter Cascade

// Construct a Bloom Filter Cascade
const validElements: Set<string> = new Set([element, '...', '...']); // Set of valid elements
const invalidElements: Set<string> = new Set(['...', '...', '...']); // Set of invalid elements
const rHat: number = x // Padding size x, where rHat >= |validElements|
const constructedBFC = constructBFC(validElements, invalidElements, rHat); // returns [filter, salt]

console.log(constructedBFC[0]); // Constructed Bloom Filter Cascade

// Check if an element is in the Bloom Filter Cascade
const filterHexString = toDataHexString(constructedBFC); // Hexadecimal string representing the Bloom Filter Cascade
const [filter, salt] = fromDataHexString(filterHexString); // Reconstruct the Bloom Filter Cascade from the hexadecimal string

const result = isInBFC(filter, salt, element);

console.log(result); // true if the element is in the Bloom Filter Cascade, false otherwise
```

## Testing the Bloom Filter
To verify that the Bloom Filter implementation works as expected, run the following command in the root directory:
```
npm test
```

## Links
<!-- TODO: insert link to Felix's paper-->
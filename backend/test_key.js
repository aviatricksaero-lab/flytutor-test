
import { extractAnswerKey } from './utils/extractAnswerKey.js';

const testText = `
1. A
2. B
3. C
4. D
5 1
6 2
7 3
8 4
`;

const result = extractAnswerKey(testText);
console.log("Result:", result);

// Expect: 0: 0, 1: 1, 2: 2, 3: 3, 4: 0, 5: 1, 6: 2, 7: 3
if (result[0] === 0 && result[1] === 1 && result[2] === 2 && result[3] === 3 &&
    result[4] === 0 && result[5] === 1 && result[6] === 2 && result[7] === 3) {
    console.log("✅ TEST PASSED");
} else {
    console.log("❌ TEST FAILED");
}

export function extractAnswerKey(text) {
    const answersMap = {};

    // Normalize whitespace
    const normalized = text.replace(/\s+/g, ' ');

    console.log("--- START ANSWER KEY EXTRACTION ---");
    // console.log("Raw text for key:", normalized.substring(0, 500) + "...");

    // 1. Try to find numbered patterns like "1. A", "1) B", "Q1: C", "1 B", "1 2"
    // Supports both letters (A-D) and numbers (1-4)
    const numberedMatches = [...normalized.matchAll(/(?:Q|q)?\.?\s*(\d{1,3})\s*[.)-:\s]\s*([A-Da-d1-4])(?:\s|$)/g)];

    if (numberedMatches.length >= 5) { // If we found a good number of matches, use them
        console.log(`✅ Found ${numberedMatches.length} numbered answer matches`);
        for (const match of numberedMatches) {
            const qNum = parseInt(match[1]);
            const val = match[2].toUpperCase();

            let idx = -1;
            if ('ABCD'.includes(val)) {
                idx = 'ABCD'.indexOf(val);
            } else if ('1234'.includes(val)) {
                idx = parseInt(val) - 1; // 1 -> 0, 2 -> 1, etc.
            }

            if (idx >= 0) {
                if (answersMap[qNum - 1] === undefined) {
                    answersMap[qNum - 1] = idx;
                }
            }
        }
    } else {
        // 2. Fallback: Look for sequences of answers if it's just a list
        const markers = [...normalized.matchAll(/\b([A-Da-d1-4])\b/g)];

        if (markers.length >= 10) {
            console.log(`⚠️ Found ${markers.length} isolated markers, using as sequential fallback`);
            let count = 0;
            for (const match of markers) {
                const val = match[1].toUpperCase();
                let idx = -1;
                if ('ABCD'.includes(val)) {
                    idx = 'ABCD'.indexOf(val);
                } else if ('1234'.includes(val)) {
                    idx = parseInt(val) - 1;
                }

                if (idx >= 0) {
                    answersMap[count++] = idx;
                }
            }
        }
    }

    console.log("Extracted Answer Map Keys:", Object.keys(answersMap).length);
    console.log("--- END ANSWER KEY EXTRACTION ---");
    return answersMap;
}

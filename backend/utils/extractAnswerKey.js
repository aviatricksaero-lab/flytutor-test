export function extractAnswerKey(text) {
    const answers = [];

    // Normalize whitespace to single spaces, deal with newlines
    const normalized = text.replace(/\s+/g, ' ');

    // Match patterns like "1. A", "(1) B", "1 - C", "Q1: D" or simply "A B C D"
    // To be safe, if we find numbered answers, we use those.
    const numberedMatches = [...normalized.matchAll(/(?:Q|q)?\.?\s*\d+\s*[.)-:]\s*([A-Da-d1-4])/g)];

    if (numberedMatches.length > 0) {
        for (const match of numberedMatches) {
            const letter = match[1].toUpperCase();
            const idx = 'ABCD1234'.indexOf(letter) % 4;
            if (idx >= 0) answers.push(idx);
        }
    } else {
        // Just extract all A, B, C, D characters if no numbers are present
        const letters = [...normalized.matchAll(/\b([A-Da-d1-4])\b/g)];
        for (const match of letters) {
            const letter = match[1].toUpperCase();
            const idx = 'ABCD1234'.indexOf(letter) % 4;
            if (idx >= 0) answers.push(idx);
        }
    }

    return answers;
}

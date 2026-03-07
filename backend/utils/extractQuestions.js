/**
 * extractQuestions(text)
 * 
 * Parses raw PDF text to extract multiple-choice questions.
 * 
 * Supported PDF formats:
 * 
 * Format A (Answer line):
 *   1. What is the capital of France?
 *   A) Paris   B) London   C) Berlin   D) Rome
 *   Answer: A
 *
 * Format B (asterisk marks correct):
 *   1. What is the capital of France?
 *   A) Paris*   B) London   C) Berlin   D) Rome
 *
 * Format C (Answer: at end of block):
 *   1. What is 2+2?
 *   a. 3   b. 4   c. 5   d. 6
 *   Ans: b
 */

export function extractQuestions(text) {
    const questions = [];

    // Normalize whitespace and line endings
    const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ {2,}/g, ' ');

    // Split on question number patterns like:  1.  2.  Q1.  Q.1  (1)
    const questionBlocks = normalized.split(/\n(?=(?:Q\.?\s*)?(?:\d{1,3})[.)]\s)/i).filter(b => b.trim());

    for (const block of questionBlocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        // ── Question text ──────────────────────────────────────────
        // Strip leading number like "1." or "Q1."
        const questionLine = lines[0].replace(/^(?:Q\.?\s*)?\d{1,3}[.)]\s*/i, '').trim();
        if (!questionLine) continue;

        // ── Collect option lines ───────────────────────────────────
        // Match: A) / A. / a) / a. / (A) / 1) / 1.
        const optionRegex = /^(?:\(?\s*([A-Da-d1-4])\s*[.)]\s*)(.*)/;
        const rawOptions = [];
        let answerHint = -1; // index of correct answer

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            // Check for explicit answer line: "Answer: B" or "Ans: 2"
            const ansLine = line.match(/^(?:ans(?:wer)?|correct)\s*[:.]\s*([A-Da-d1-4])/i);
            if (ansLine) {
                const letter = ansLine[1].toUpperCase();
                answerHint = 'ABCD1234'.indexOf(letter) % 4;
                continue;
            }

            // Inline options like "A) Paris  B) London  C) Berlin  D) Rome"
            const inlineMatches = [...line.matchAll(/\b([A-Da-d])\s*[.)]\s*([^A-Da-d]*?)(?=\s+[A-Da-d]\s*[.)]|$)/g)];
            if (inlineMatches.length >= 2) {
                for (const m of inlineMatches) {
                    let optText = m[2].trim();
                    // Asterisk = correct answer
                    if (optText.endsWith('*')) {
                        const idx = rawOptions.length;
                        answerHint = idx;
                        optText = optText.slice(0, -1).trim();
                    }
                    if (optText) rawOptions.push(optText);
                }
                break;
            }

            const m = line.match(optionRegex);
            if (m) {
                let optText = m[2].trim();
                if (optText.endsWith('*')) {
                    answerHint = rawOptions.length;
                    optText = optText.slice(0, -1).trim();
                }
                if (optText) rawOptions.push(optText);
            }
        }

        if (rawOptions.length < 2) continue; // skip if not enough options

        questions.push({
            text: questionLine,
            options: rawOptions.slice(0, 4),
            correctAnswer: answerHint >= 0 ? answerHint : 0
        });
    }

    return questions;
}

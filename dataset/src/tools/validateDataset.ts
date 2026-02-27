import fs from "node:fs/promises";
import { z } from "zod";
import { filterPronunciations, getSuspiciousWordReasons } from "../utils.ts";

const datasetLineSchema = z.object({
  word: z.string(),
  kata: z.array(z.string()).length(1),
});

async function main() {
  const datasetPath = process.argv[2];
  if (datasetPath == null) {
    throw new Error("Usage: pnpm run tools:validateDataset <dataset.jsonl>");
  }

  const content = await fs.readFile(datasetPath, "utf-8");
  const lines = content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => datasetLineSchema.parse(JSON.parse(line)));

  let suspiciousWordCount = 0;
  let invalidPronunciationCount = 0;

  for (const { word, kata } of lines) {
    const suspiciousReasons = getSuspiciousWordReasons(word);
    if (suspiciousReasons.length > 0) {
      suspiciousWordCount++;
      console.warn(
        `Warning: suspicious dataset word: ${word} (${suspiciousReasons.join(",")})`,
      );
    }

    const filtered = filterPronunciations({ [word]: kata[0] });
    if (!(word in filtered)) {
      invalidPronunciationCount++;
      console.warn(`Warning: invalid pronunciation in dataset: ${word}`);
    }
  }

  console.log(`Validated ${lines.length} lines in ${datasetPath}`);
  console.log(
    `Warnings: suspiciousWord=${suspiciousWordCount}, invalidPronunciation=${invalidPronunciationCount}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

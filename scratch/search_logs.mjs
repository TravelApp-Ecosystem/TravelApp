import { readFileSync } from "fs";

const content = readFileSync("C:/Users/frinc/.gemini/antigravity/brain/1f7fb7d7-e09c-4d0b-bfe1-93f55770825a/.system_generated/logs/transcript.jsonl", "utf8");
const lines = content.split("\n");
console.log("Searching logs...");
for (const line of lines) {
  if (line.toLowerCase().includes("gemini") && line.toLowerCase().includes("key")) {
    // Print first 300 characters of matching line
    console.log(line.substring(0, 300) + "...");
  }
}

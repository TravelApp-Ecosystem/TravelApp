import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("scratch/tariffs_dump.json", "utf8"));

console.log("=== TARIFFS ===");
data.tariffs.forEach(t => {
  const { icon, ...rest } = t;
  console.log(JSON.stringify(rest, null, 2));
});

console.log("=== CATEGORIES ===");
data.categories.forEach(c => {
  const { icon, ...rest } = c;
  console.log(JSON.stringify(rest, null, 2));
});

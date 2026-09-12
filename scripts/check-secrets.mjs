import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { secretFindings } from "./secret-rules.mjs";

const paths = [
  ...new Set(
    execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { encoding: "utf8" },
    )
      .split("\0")
      .filter(Boolean),
  ),
];
let failures = 0;
for (const path of paths) {
  if (!existsSync(path)) continue;
  const buffer = readFileSync(path);
  const findings = secretFindings(
    path,
    buffer.includes(0) ? "" : buffer.toString("utf8"),
  );
  for (const reason of findings) {
    console.error(`${path}: ${reason} (value redacted)`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
else
  console.log(
    `Secret scan passed for ${paths.length} tracked/unignored files. Review the diff manually as well.`,
  );

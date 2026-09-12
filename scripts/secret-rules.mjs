export function secretFindings(path, contents) {
  const findings = [];
  if (
    (/(^|\/)\.env(?:\..*)?$/.test(path) &&
      !path.endsWith("/.env.example") &&
      path !== ".env.example") ||
    /(?:\.pem|\.key|\.dump|\.sql|\.backup)$|(?:^|\/)tokens\.json$/.test(path)
  )
    findings.push("sensitive filename");
  const knownToken =
    /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,})/;
  if (knownToken.test(contents)) findings.push("token-shaped value");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contents))
    findings.push("private key");
  if (/postgres(?:ql)?:\/\/[^\s/:]+:[^\s/@]+@/.test(contents))
    findings.push("credential-bearing database URL");
  for (const [i, line] of contents.split("\n").entries()) {
    if (/^\s*#/.test(line)) continue;
    const assignment =
      /^\s*(?:export\s+)?(?:ENCRYPTION_KEY|DATABASE_PASS|POSTGRES_PASSWORD|API_TOKEN|TESLAMATE_API_TOKEN|NEXT_PUBLIC_API_TOKEN)\s*[:=]\s*(.*?)\s*$/.exec(
        line,
      );
    if (assignment) {
      const value = assignment[1].replace(/^["']|["']$/g, "").trim();
      if (value && !value.startsWith("${"))
        findings.push(`literal credential assignment at line ${i + 1}`);
    }
  }
  return findings;
}

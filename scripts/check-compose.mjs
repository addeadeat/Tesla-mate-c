import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { parseDocument } from "yaml";

const read = (file) => {
  const doc = parseDocument(readFileSync(file, "utf8"), { uniqueKeys: true });
  assert.equal(doc.errors.length, 0, `${file}: invalid YAML`);
  return doc.toJS();
};
const base = read("deploy/docker-compose.yml");
const overlay = read("deploy/docker-compose.api.yml");
assert.equal(base.name, "z-teslamate");
assert.deepEqual(Object.keys(base.services).sort(), [
  "database",
  "grafana",
  "mosquitto",
  "teslamate",
]);
assert.deepEqual(Object.keys(overlay.services), ["teslamateapi"]);
const services = { ...base.services, ...overlay.services };
const images = {
  teslamate: "teslamate/teslamate:latest",
  database: "postgres:17",
  grafana: "teslamate/grafana:latest",
  mosquitto: "eclipse-mosquitto:2",
  teslamateapi: "tobiasehlert/teslamateapi:latest",
};
for (const [name, service] of Object.entries(services)) {
  assert.equal(service.image, images[name], `unexpected image: ${name}`);
  assert.equal(service.environment.TZ, "${TZ:-Asia/Hong_Kong}");
  assert(
    !service.network_mode && !service.privileged,
    "host network / privileged forbidden",
  );
  for (const mapping of service.ports ?? []) {
    assert.match(
      mapping,
      /^\$\{BIND_ADDRESS:-127\.0\.0\.1\}:\$\{[A-Z_]+:-\d+\}:\d+$/,
      "explicit private interface required",
    );
  }
  for (const dependency of Object.keys(service.depends_on ?? {}))
    assert(services[dependency], `missing service: ${dependency}`);
}
assert(
  !services.database.ports && !services.mosquitto.ports,
  "DB/MQTT must remain internal",
);
assert.deepEqual(services.teslamate.cap_drop, ["all"]);
assert(
  services.database.volumes.includes("teslamate-db:/var/lib/postgresql/data"),
);
assert(Object.hasOwn(base.volumes, "teslamate-db"));
for (const name of ["teslamate", "grafana", "teslamateapi"]) {
  assert.equal(services[name].environment.DATABASE_HOST, "database");
  assert.match(
    services[name].environment.DATABASE_PASS,
    /^\$\{DATABASE_PASS:\?/,
  );
}
for (const name of ["teslamate", "teslamateapi"]) {
  assert.equal(services[name].environment.MQTT_HOST, "mosquitto");
  assert.match(
    services[name].environment.ENCRYPTION_KEY,
    /^\$\{ENCRYPTION_KEY:\?/,
  );
}
for (const flag of [
  "ENABLE_COMMANDS",
  "COMMANDS_ALL",
  "COMMANDS_WAKE",
  "API_TOKEN_DISABLE",
])
  assert.equal(services.teslamateapi.environment[flag], "false");
console.log(
  "Compose YAML, merged service references, images, secret references and network invariants passed.",
);
console.log(
  "This is static validation, not docker compose config or a running-container check.",
);

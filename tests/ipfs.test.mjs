import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

const cid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3g3b6zj5qnqvyamztqfup2m4u";
const server = createServer((request, response) => {
  assert.equal(request.method, "POST");
  assert.match(request.url, /^\/api\/v0\/add\?/);
  assert.match(request.url, /pin=true/);
  assert.match(request.url, /cid-version=1/);
  let bytes = 0;
  request.on("data", (chunk) => (bytes += chunk.length));
  request.on("end", () => {
    assert.ok(bytes > 0);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ Name: "proof.txt", Hash: cid, Size: "5" }));
  });
});

before(
  () =>
    new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    }),
);
after(() => server.close());

test("IPFS route pins a bounded file and returns its canonical URI", async () => {
  const address = server.address();
  assert.ok(address && typeof address === "object");
  process.env.IPFS_RPC_URL = `http://127.0.0.1:${address.port}`;
  delete process.env.PINATA_JWT;
  const { POST } = await import("../app/api/ipfs/route.ts");
  const data = new FormData();
  data.set("file", new File(["proof"], "proof.txt", { type: "text/plain" }));
  const result = await POST(
    new Request("http://localhost/api/ipfs", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: data,
    }),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    cid,
    uri: `ipfs://${cid}`,
    name: "proof.txt",
    size: 5,
  });
});

test("IPFS route rejects cross-origin and oversized uploads before pinning", async () => {
  const { POST } = await import("../app/api/ipfs/route.ts");
  const crossOrigin = await POST(
    new Request("http://localhost/api/ipfs", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      body: new FormData(),
    }),
  );
  assert.equal(crossOrigin.status, 403);
  const oversized = await POST(
    new Request("http://localhost/api/ipfs", {
      method: "POST",
      headers: { "content-length": String(5 * 1024 * 1024) },
      body: new FormData(),
    }),
  );
  assert.equal(oversized.status, 413);
});

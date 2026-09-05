export const runtime = "nodejs";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function response(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function rateLimited(request: Request) {
  const key =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  if (attempts.size > 1_000) {
    for (const [attemptKey, value] of attempts)
      if (value.resetAt <= now) attempts.delete(attemptKey);
    if (attempts.size > 1_000) attempts.clear();
  }
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function validCid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value) ||
      /^b[a-z2-7]{20,}$/.test(value))
  );
}

async function pinWithPinata(file: File, jwt: string) {
  const body = new FormData();
  body.set("file", file, file.name);
  body.set(
    "pinataMetadata",
    JSON.stringify({ name: `pact-${Date.now()}-${file.name.slice(0, 80)}` }),
  );
  const upstream = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!upstream.ok) throw new Error(`Pinata returned ${upstream.status}`);
  const result = (await upstream.json()) as { IpfsHash?: unknown };
  return result.IpfsHash;
}

async function pinWithKubo(file: File, rpcUrl: string) {
  const body = new FormData();
  body.set("file", file, file.name);
  const endpoint = new URL("/api/v0/add", rpcUrl);
  endpoint.searchParams.set("pin", "true");
  endpoint.searchParams.set("cid-version", "1");
  endpoint.searchParams.set("progress", "false");
  const upstream = await fetch(endpoint, {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!upstream.ok) throw new Error(`Kubo returned ${upstream.status}`);
  const lines = (await upstream.text()).trim().split("\n");
  const result = JSON.parse(lines.at(-1) || "{}") as { Hash?: unknown };
  return result.Hash;
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return response("Cross-origin upload rejected.", 403);
  if (rateLimited(request))
    return response("Upload limit reached. Wait a minute and try again.", 429);
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_FILE_BYTES + 100_000)
    return response("Files must be 4 MB or smaller.", 413);

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0)
      return response("Choose a non-empty file to upload.", 400);
    if (file.size > MAX_FILE_BYTES)
      return response("Files must be 4 MB or smaller.", 413);

    const jwt = process.env.PINATA_JWT?.trim();
    const kubo =
      process.env.IPFS_RPC_URL?.trim() ||
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:5001" : "");
    if (!jwt && !kubo)
      return response(
        "IPFS uploads are not configured. Paste a direct HTTPS or ipfs:// reference instead.",
        503,
      );

    const cid = jwt
      ? await pinWithPinata(file, jwt)
      : await pinWithKubo(file, kubo);
    if (!validCid(cid))
      throw new Error("Pinning service returned an invalid CID");
    return Response.json(
      { cid, uri: `ipfs://${cid}`, name: file.name, size: file.size },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "IPFS upload failed:",
      error instanceof Error ? error.message : "unknown error",
    );
    return response(
      "The file could not be pinned. Try again or paste a direct link.",
      502,
    );
  }
}

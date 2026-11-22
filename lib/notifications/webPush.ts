import { createCipheriv, createECDH, createHash, createPrivateKey, hkdfSync, randomBytes, sign } from "node:crypto";

type Subscription = { endpoint: string; p256dh: string; auth: string };
const b64 = (input: Buffer | Uint8Array) => Buffer.from(input).toString("base64url");
const decode = (input: string) => Buffer.from(input, "base64url");

export function publicVapidKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export async function sendWebPush(subscription: Subscription, payload: object) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error("VAPID configuration missing");
  const url = new URL(subscription.endpoint);
  if (url.protocol !== "https:") throw new Error("Invalid push endpoint");
  const audience = url.origin;
  const header = b64(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64(Buffer.from(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 3600, sub: subject })));
  const vapidPrivate = createPrivateKey({
    key: { kty: "EC", crv: "P-256", x: b64(decode(publicKey).subarray(1, 33)), y: b64(decode(publicKey).subarray(33)), d: b64(decode(privateKey)) },
    format: "jwk",
  });
  const jwt = `${header}.${claims}.${b64(sign("sha256", Buffer.from(`${header}.${claims}`), { key: vapidPrivate, dsaEncoding: "ieee-p1363" }))}`;

  // RFC 8291 Web Push encryption using aes128gcm.
  const clientKey = decode(subscription.p256dh);
  const clientAuth = decode(subscription.auth);
  const server = createECDH("prime256v1");
  server.generateKeys();
  const serverPublic = server.getPublicKey();
  const sharedSecret = server.computeSecret(clientKey);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), clientKey, serverPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", sharedSecret, clientAuth, keyInfo, 32));
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const plaintext = Buffer.concat([Buffer.from(JSON.stringify(payload)), Buffer.from([2])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(4096);
  const body = Buffer.concat([salt, recordSize, Buffer.from([serverPublic.length]), serverPublic, ciphertext]);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "3600",
      "Authorization": `vapid t=${jwt}, k=${publicKey}`,
      "Content-Length": String(body.length),
    },
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(10000),
  });
  return response.status;
}

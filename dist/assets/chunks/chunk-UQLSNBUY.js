// client/core/security.js
async function hashPassword(password) {
  const encodedPassword = new TextEncoder().encode(password);
  const subtleCrypto = globalThis.crypto?.subtle;
  if (subtleCrypto?.digest) {
    const buffer = await subtleCrypto.digest("SHA-256", encodedPassword);
    return bytesToHex(new Uint8Array(buffer));
  }
  return sha256Fallback(encodedPassword);
}
function bytesToHex(bytes) {
  return [...bytes].map((item) => item.toString(16).padStart(2, "0")).join("");
}
function sha256Fallback(inputBytes) {
  const K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  const len = inputBytes.length;
  const bitLen = len * 8;
  const blockCount = len + 9 + 63 >> 6 << 6;
  const padded = new Uint8Array(blockCount);
  padded.set(inputBytes);
  padded[len] = 128;
  const dv = new DataView(padded.buffer);
  dv.setUint32(blockCount - 4, bitLen >>> 0, false);
  dv.setUint32(blockCount - 8, bitLen / 4294967296 >>> 0, false);
  const H = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  const W = new Uint32Array(64);
  const st = new Uint32Array(8);
  for (let i = 0; i < blockCount; i += 64) {
    for (let t = 0; t < 16; t++) {
      W[t] = dv.getUint32(i + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = (rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ W[t - 15] >>> 3) >>> 0;
      const s1 = (rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ W[t - 2] >>> 10) >>> 0;
      W[t] = W[t - 16] + s0 + W[t - 7] + s1 >>> 0;
    }
    st.set(H);
    for (let t = 0; t < 64; t++) {
      const S1 = (rotr(st[4], 6) ^ rotr(st[4], 11) ^ rotr(st[4], 25)) >>> 0;
      const ch = (st[4] & st[5] ^ ~st[4] & st[6]) >>> 0;
      const T1 = st[7] + S1 + ch + K[t] + W[t] >>> 0;
      const S0 = (rotr(st[0], 2) ^ rotr(st[0], 13) ^ rotr(st[0], 22)) >>> 0;
      const maj = (st[0] & st[1] ^ st[0] & st[2] ^ st[1] & st[2]) >>> 0;
      const T2 = S0 + maj >>> 0;
      st[7] = st[6];
      st[6] = st[5];
      st[5] = st[4];
      st[4] = st[3] + T1 >>> 0;
      st[3] = st[2];
      st[2] = st[1];
      st[1] = st[0];
      st[0] = T1 + T2 >>> 0;
    }
    for (let t = 0; t < 8; t++) H[t] = H[t] + st[t] >>> 0;
  }
  return bytesToHex(new Uint8Array(H.buffer));
}
function rotr(x, n) {
  return (x >>> n | x << 32 - n) >>> 0;
}
var UID_PREFIXES = {
  comment: "cmt",
  attachment: "att",
  approval: "apv",
  task: "tsk",
  member: "mbr",
  point: "pnt"
};
function uid(prefix) {
  const shortPrefix = UID_PREFIXES[prefix] || prefix;
  return `${shortPrefix}_${randomHex()}_${timestampSuffix()}`;
}
function randomHex() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, "0")).join("");
}
function timestampSuffix() {
  return Date.now().toString(36);
}
function escapeHtml(value) {
  if (value == null) {
    return "";
  }
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttribute(value) {
  return escapeHtml(value);
}

export {
  hashPassword,
  uid,
  escapeHtml,
  escapeAttribute
};

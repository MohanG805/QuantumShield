import { toBase64, fromBase64 } from "./utils.js";

// This loader uses dynamic import to handle different export shapes of the
// `pqc-kyber` package (named export, default, or factory). It tries a few
// strategies so the rest of the app can call the simple functions below.

let _inst = null;

async function ensure() {
  if (_inst) return _inst;

  // dynamic import so Vite handles the WASM plugin and we can inspect exports
  const pkg = await import('pqc-kyber');

  // pkg might be:
  // - { Kyber: class }
  // - default export which is the class/function
  // - default export is an object with Kyber property
  // - or a factory that requires calling to initialize

  const tryConstruct = (Ctor) => {
    try {
      return new Ctor();
    } catch (e) {
      return null;
    }
  };

  // 1) named export
  if (pkg && typeof pkg.Kyber === 'function') {
    _inst = tryConstruct(pkg.Kyber);
  }

  // 2) default export is the constructor/class
  if (!_inst && pkg && pkg.default && typeof pkg.default === 'function') {
    _inst = tryConstruct(pkg.default);
  }

  // 3) default.Kyber
  if (!_inst && pkg && pkg.default && typeof pkg.default.Kyber === 'function') {
    _inst = tryConstruct(pkg.default.Kyber);
  }

  // 4) pkg itself is an object exposing a create/init factory
  if (!_inst && pkg && typeof pkg.create === 'function') {
    _inst = await pkg.create();
  }

  // 5) pkg.default may be an object with an async init method
  if (!_inst && pkg && pkg.default && typeof pkg.default.create === 'function') {
    _inst = await pkg.default.create();
  }

  // 6) some builds export functions directly on the module namespace
  if (!_inst && pkg && (typeof pkg.keypair === 'function' || typeof pkg.encapsulate === 'function' || typeof pkg.decapsulate === 'function')) {
    // create a small adapter so callers can use instance-like methods
    _inst = {
      keypair: pkg.keypair,
      encapsulate: pkg.encapsulate,
      decapsulate: pkg.decapsulate
    };
  }

  // 7) same for default
  if (!_inst && pkg && pkg.default && (typeof pkg.default.keypair === 'function' || typeof pkg.default.encapsulate === 'function' || typeof pkg.default.decapsulate === 'function')) {
    _inst = {
      keypair: pkg.default.keypair,
      encapsulate: pkg.default.encapsulate,
      decapsulate: pkg.default.decapsulate
    };
  }

  if (!_inst) {
    // last resort: if pkg.default is an object instance
    if (pkg && pkg.default && typeof pkg.default === 'object') {
      _inst = pkg.default;
    }
  }

  if (!_inst) {
    throw new Error('Could not initialize pqc-kyber: exports=' + Object.keys(pkg).join(','));
  }

  const methods = (_inst && typeof _inst === 'object') ? Object.keys(_inst).join(',') : String(typeof _inst);
  console.log('pqc-kyber initialized, instance methods: ' + methods);
  return _inst;
}

export async function loadKyber() {
  await ensure();
  return { kem: _inst };
}

export async function generateKeypair() {
  const k = await ensure();
  // many implementations expose keypair() or generateKeypair()
  if (typeof k.keypair === 'function') {
    const kp = k.keypair();
    // kp may be a wrapper with getters (pubkey/secret) or plain properties (publicKey/privateKey)
    const pub = (kp && (kp.publicKey ?? kp.pubkey ?? kp.pub)) || null;
    const priv = (kp && (kp.privateKey ?? kp.secret ?? kp.priv ?? kp.private)) || null;
    // If getters throw or return wrapper objects, try accessing common getters safely
    const safeGet = (obj, prop) => {
      try {
        return obj && obj[prop];
      } catch (e) {
        return null;
      }
    };
    const pubArr = pub instanceof Uint8Array ? pub : safeGet(kp, 'pubkey') || safeGet(kp, 'publicKey') || safeGet(kp, 'public');
    const privArr = priv instanceof Uint8Array ? priv : safeGet(kp, 'secret') || safeGet(kp, 'privateKey') || safeGet(kp, 'private');
    if (pubArr && privArr) {
      return { publicKeyB64: toBase64(pubArr.buffer), privateKeyB64: toBase64(privArr.buffer) };
    }
    // sometimes keypair() returns a Keys wrapper where pubkey() must be accessed via method names exported by wasm
    // fallback: try to call functions that may exist on the module
    if (kp && typeof kp.pubkey === 'function') {
      const p = kp.pubkey();
      const s = kp.secret && kp.secret();
      if (p instanceof Uint8Array && s instanceof Uint8Array) return { publicKeyB64: toBase64(p.buffer), privateKeyB64: toBase64(s.buffer) };
    }
    throw new Error('Unexpected keypair() result shape');
  }
  if (typeof k.generateKeypair === 'function') {
    const kp = k.generateKeypair();
    const pub = (kp && (kp.publicKey ?? kp.pubkey ?? kp.pub)) || null;
    const priv = (kp && (kp.privateKey ?? kp.secret ?? kp.priv ?? kp.private)) || null;
    if (pub instanceof Uint8Array && priv instanceof Uint8Array) return { publicKeyB64: toBase64(pub.buffer), privateKeyB64: toBase64(priv.buffer) };
    throw new Error('Unexpected generateKeypair() result shape');
  }
  // if the instance itself is the key bytes (unlikely), throw
  throw new Error('pqc-kyber instance does not provide keypair()/generateKeypair()');
}

export async function encapsulate(publicKeyB64) {
  const k = await ensure();
  const pub = new Uint8Array(fromBase64(publicKeyB64));
  if (typeof k.encapsulate === 'function') {
    const { ciphertext, sharedSecret } = k.encapsulate(pub);
    return { ciphertextB64: toBase64(ciphertext.buffer), sharedSecretRaw: sharedSecret.buffer };
  }
  if (typeof k.encap === 'function') {
    const { ciphertext, sharedSecret } = k.encap(pub);
    return { ciphertextB64: toBase64(ciphertext.buffer), sharedSecretRaw: sharedSecret.buffer };
  }
  throw new Error('pqc-kyber instance does not provide encapsulate()/encap()');
}

export async function decapsulate(ciphertextB64, privateKeyB64) {
  const k = await ensure();
  const ct = new Uint8Array(fromBase64(ciphertextB64));
  const priv = new Uint8Array(fromBase64(privateKeyB64));
  if (typeof k.decapsulate === 'function') {
    const sharedSecret = k.decapsulate(ct, priv);
    return sharedSecret.buffer;
  }
  if (typeof k.decap === 'function') {
    const sharedSecret = k.decap(ct, priv);
    return sharedSecret.buffer;
  }
  throw new Error('pqc-kyber instance does not provide decapsulate()/decap()');
}

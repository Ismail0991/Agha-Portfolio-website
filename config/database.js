const admin = require("firebase-admin");
const path = require("path");

// Credentials resolve from an env var first, then a local key file.
//
// The key file is a private credential and must never be committed, so on a host like
// Render there is no file to read -- the whole key is supplied as an env var instead.
// Locally the file stays convenient. Base64 is offered because dashboards routinely
// mangle the literal newlines inside a raw JSON private key.
const loadServiceAccount = () => {
  const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_SERVICE_ACCOUNT_BASE64 } = process.env;

  if (FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const json = Buffer.from(FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
      return { key: JSON.parse(json), source: "FIREBASE_SERVICE_ACCOUNT_BASE64" };
    } catch (error) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64-encoded JSON: ${error.message}`
      );
    }
  }

  if (FIREBASE_SERVICE_ACCOUNT) {
    try {
      return { key: JSON.parse(FIREBASE_SERVICE_ACCOUNT), source: "FIREBASE_SERVICE_ACCOUNT" };
    } catch (error) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${error.message}`);
    }
  }

  const keyFile = process.env.FIREBASE_KEY_FILE || "traineedata-a1379-8c9c23dd84c8.json";

  // Absolute paths are passed through: hosts that mount secrets outside the repo
  // (Render exposes them at /etc/secrets/<name>) need the path used verbatim.
  const candidates = path.isAbsolute(keyFile)
    ? [keyFile]
    : [path.join(__dirname, "..", keyFile), path.join("/etc/secrets", keyFile)];

  for (const candidate of candidates) {
    try {
      return { key: require(candidate), source: candidate };
    } catch (error) {
      if (error.code !== "MODULE_NOT_FOUND") throw error;
    }
  }

  throw new Error(
    `No Firebase credentials found. Looked for:\n` +
      candidates.map((c) => `    ${c}`).join("\n") +
      `\n  Set FIREBASE_SERVICE_ACCOUNT_BASE64, or supply the key file at one of the above.`
  );
};

const { key: serviceAccountKey, source: credentialSource } = loadServiceAccount();

const initializeFirebase = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
    projectId: serviceAccountKey.project_id,
  });
  console.log(`Firebase initialized (project: ${serviceAccountKey.project_id})`);
};

// initializeApp only parses the key -- it never contacts Google, so a revoked key still
// "succeeds" there and fails later on the first Firestore call. Minting a token proves
// the credential is actually accepted, surfacing bad keys at startup instead of at request time.
const verifyFirebaseCredential = async () => {
  try {
    await admin.app().options.credential.getAccessToken();
    console.log("Firebase credential verified");
    return true;
  } catch (error) {
    console.error("\nFIREBASE CREDENTIAL REJECTED");
    console.error(`  source : ${credentialSource}`);
    console.error(`  project: ${serviceAccountKey.project_id}`);
    console.error(`  reason : ${error.message}`);
    if (/invalid_grant|Invalid JWT Signature/i.test(error.message)) {
      console.error("  This key was revoked or deleted in the Google Cloud console.");
      console.error("  Generate a new one: Firebase Console > Project Settings >");
      console.error("  Service Accounts > Generate new private key.\n");
    }
    return false;
  }
};

// Get Firestore instance
const getFirestore = () => {
  return admin.firestore();
};

module.exports = { initializeFirebase, verifyFirebaseCredential, getFirestore };

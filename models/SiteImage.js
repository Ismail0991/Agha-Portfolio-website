const admin = require("firebase-admin");

const COLLECTION = "siteImages";

// The registry of images on the site that an admin may replace. Adding a slot here is
// all that is needed for it to appear in the admin panel -- the UI renders from this.
// `key` doubles as the Firestore document id, so lookups are direct gets, not queries.
const SLOTS = [
  {
    key: "home.hero",
    label: "Home - About Gallery (3rd image)",
    description: "One of the three images in the About collage on the home page.",
    default: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
  },
  {
    key: "about.story",
    label: "About - Our Story",
    description: "First image in the About collage (home) and the About page.",
    default: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=700&q=80",
  },
  {
    key: "about.culture",
    label: "About - Team Culture",
    description: "Second image in the About collage (home) and the About page.",
    default: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  },
  {
    key: "blog.fallback",
    label: "Blog - Default Cover",
    description: "Used for any post that has no cover image of its own.",
    default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80",
  },
  {
    key: "team.fallback",
    label: "Team - Default Avatar",
    description: "Used for any team member with no photo of their own.",
    default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  },
];

const SLOT_KEYS = SLOTS.map((s) => s.key);

class SiteImage {
  constructor(data) {
    this.key = data.key;
    this.url = data.url;
    this.publicId = data.publicId || null;
    this.updatedAt = data.updatedAt || new Date();
  }

  toDoc() {
    // key is the document id, not a field inside it.
    return { url: this.url, publicId: this.publicId, updatedAt: this.updatedAt };
  }

  static isValidKey(key) {
    return SLOT_KEYS.includes(key);
  }

  static async save(key, { url, publicId }) {
    if (!SiteImage.isValidKey(key)) {
      throw new Error(`Unknown image slot: ${key}`);
    }
    const db = admin.firestore();
    const image = new SiteImage({ key, url, publicId, updatedAt: new Date() });
    await db.collection(COLLECTION).doc(key).set(image.toDoc());
    return image;
  }

  static async reset(key) {
    if (!SiteImage.isValidKey(key)) {
      throw new Error(`Unknown image slot: ${key}`);
    }
    const db = admin.firestore();
    await db.collection(COLLECTION).doc(key).delete();
  }

  // Every slot, with the stored override applied over its default. Always returns the
  // full set so the site renders even when nothing has been customised yet.
  static async findAll() {
    const db = admin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const stored = {};
    snapshot.docs.forEach((doc) => {
      stored[doc.id] = doc.data();
    });

    return SLOTS.map((slot) => ({
      key: slot.key,
      label: slot.label,
      description: slot.description,
      url: stored[slot.key]?.url || slot.default,
      publicId: stored[slot.key]?.publicId || null,
      isCustom: Boolean(stored[slot.key]?.url),
      defaultUrl: slot.default,
    }));
  }

  // Flat { key: url } map -- what the public pages consume.
  static async findAllAsMap() {
    const all = await SiteImage.findAll();
    return all.reduce((map, slot) => {
      map[slot.key] = slot.url;
      return map;
    }, {});
  }
}

module.exports = SiteImage;
module.exports.SLOTS = SLOTS;
module.exports.SLOT_KEYS = SLOT_KEYS;

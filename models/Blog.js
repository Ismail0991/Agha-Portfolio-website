const admin = require("firebase-admin");

const COLLECTION = "blogs";

// createdAt is a Firestore Timestamp when read back, a Date on a freshly built object,
// and a string if it round-tripped through JSON. Undefined sorts last rather than NaN.
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

class Blog {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title;
    this.slug = data.slug;
    this.content = data.content;
    this.excerpt = data.excerpt || "";
    this.category = data.category || "";
    this.author = data.author || "";
    this.image = data.image || "";
    this.tags = data.tags || [];
    this.views = data.views || 0;
    this.published = data.published !== false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Firestore rejects objects with custom prototypes, so a class instance can't be
  // written directly. id is dropped too -- it's the document's key, not a field in it.
  toDoc() {
    const { id, ...doc } = this;
    return { ...doc };
  }

  async save() {
    const db = admin.firestore();

    this.updatedAt = new Date();

    if (this.id) {
      await db.collection(COLLECTION).doc(this.id).update(this.toDoc());
    } else {
      const docRef = await db.collection(COLLECTION).add(this.toDoc());
      this.id = docRef.id;
    }
    return this;
  }

  static async findBySlug(slug) {
    const db = admin.firestore();
    const query = await db
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (query.empty) return null;

    const doc = query.docs[0];
    return new Blog({ id: doc.id, ...doc.data() });
  }

  static async findById(id) {
    const db = admin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();
    
    if (!doc.exists) return null;
    
    return new Blog({ id: doc.id, ...doc.data() });
  }

  static async findAll(filter = {}) {
    const db = admin.firestore();
    let query = db.collection(COLLECTION);

    if (filter.published !== undefined) {
      query = query.where("published", "==", filter.published);
    }

    if (filter.category) {
      query = query.where("category", "==", filter.category);
    }

    const snapshot = await query.get();

    const blogs = snapshot.docs.map(
      (doc) => new Blog({ id: doc.id, ...doc.data() })
    );

    // Sorted here rather than with Firestore's orderBy: pairing a where() with an
    // orderBy() on a different field demands a composite index that has to be created
    // per project, which silently 500s the whole blog list until someone does it.
    // Equality-only filters need no such index. Revisit if the post count grows large
    // enough that fetching the full filtered set becomes wasteful.
    return blogs.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  }

  async incrementViews() {
    const db = admin.firestore();
    this.views = (this.views || 0) + 1;
    await db.collection(COLLECTION).doc(this.id).update({ views: this.views });
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete unsaved blog");
    const db = admin.firestore();
    await db.collection(COLLECTION).doc(this.id).delete();
  }
}

module.exports = Blog;

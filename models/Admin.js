const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

const COLLECTION = "admins";

class Admin {
  constructor(data) {
    this.id = data.id || null;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || "admin";
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

    // Hash password if it's a new doc or password changed
    if (!this.id && this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    this.updatedAt = new Date();

    if (this.id) {
      await db.collection(COLLECTION).doc(this.id).update(this.toDoc());
    } else {
      const docRef = await db.collection(COLLECTION).add(this.toDoc());
      this.id = docRef.id;
    }
    return this;
  }

  static async findByUsername(username) {
    const db = admin.firestore();
    const query = await db
      .collection(COLLECTION)
      .where("username", "==", username)
      .limit(1)
      .get();

    if (query.empty) return null;

    const doc = query.docs[0];
    return new Admin({ id: doc.id, ...doc.data() });
  }

  static async findById(id) {
    const db = admin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();
    
    if (!doc.exists) return null;
    
    return new Admin({ id: doc.id, ...doc.data() });
  }

  static async findAll() {
    const db = admin.firestore();
    const snapshot = await db.collection(COLLECTION).get();
    
    return snapshot.docs.map(
      (doc) => new Admin({ id: doc.id, ...doc.data() })
    );
  }

  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete unsaved admin");
    const db = admin.firestore();
    await db.collection(COLLECTION).doc(this.id).delete();
  }
}

module.exports = Admin;

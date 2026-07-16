const admin = require("firebase-admin");

const COLLECTION = "teamMembers";

class TeamMember {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.position = data.position || "";
    this.bio = data.bio || "";
    this.image = data.image || "";
    this.email = data.email || "";
    this.phone = data.phone || "";
    this.expertise = data.expertise || [];
    this.social = data.social || { twitter: "", linkedin: "", github: "" };
    this.order = data.order || 0;
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

  static async findById(id) {
    const db = admin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();
    
    if (!doc.exists) return null;
    
    return new TeamMember({ id: doc.id, ...doc.data() });
  }

  static async findAll() {
    const db = admin.firestore();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("order", "asc")
      .get();
    
    return snapshot.docs.map(
      (doc) => new TeamMember({ id: doc.id, ...doc.data() })
    );
  }

  static async findByEmail(email) {
    const db = admin.firestore();
    const query = await db
      .collection(COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (query.empty) return null;

    const doc = query.docs[0];
    return new TeamMember({ id: doc.id, ...doc.data() });
  }

  async delete() {
    if (!this.id) throw new Error("Cannot delete unsaved team member");
    const db = admin.firestore();
    await db.collection(COLLECTION).doc(this.id).delete();
  }
}

module.exports = TeamMember;

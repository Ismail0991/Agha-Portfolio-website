const TeamMember = require("../models/TeamMember");

exports.getAllTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.findAll();
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTeamMember = async (req, res) => {
  const { name, position, bio, image, email, phone, expertise, social, order } =
    req.body;

  try {
    const member = new TeamMember({
      name,
      position,
      bio,
      image,
      email,
      phone,
      // The form posts a comma-separated string, but API clients may send an array.
      expertise: Array.isArray(expertise)
        ? expertise
        : expertise
        ? expertise.split(",")
        : [],
      social,
      order,
    });
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mirrors updateBlog: assigning req.body wholesale let a client overwrite id (making
// save() target a different document) and skipped the expertise string -> array
// conversion that createTeamMember does.
const TEAM_UPDATABLE = [
  "name",
  "position",
  "bio",
  "image",
  "email",
  "phone",
  "social",
  "order",
];

exports.updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }

    for (const field of TEAM_UPDATABLE) {
      if (req.body[field] !== undefined) member[field] = req.body[field];
    }

    if (req.body.expertise !== undefined) {
      const { expertise } = req.body;
      member.expertise = Array.isArray(expertise)
        ? expertise
        : expertise
        ? expertise.split(",")
        : [];
    }

    await member.save();
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    await member.delete();
    res.json({ message: "Team member deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

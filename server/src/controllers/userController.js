import User from "../models/User.js";

export const listUsers = async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const users = await User.find().select("-passwordHash");
  res.json(users);
};

export const toggleUserActive = async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ message: `User ${user.isActive ? "activated" : "deactivated"}`, user });
};

export const deleteUser = async (req, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted successfully" });
};

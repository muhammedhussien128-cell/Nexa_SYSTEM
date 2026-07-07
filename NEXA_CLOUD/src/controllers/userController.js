const bcrypt = require('bcrypt');

const prisma = require('../prismaClient');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.systemUser.findMany({
      select: { id: true, username: true, role: true, permissions: true, createdAt: true }
    });
    
    const parsedUsers = users.map(u => ({
      ...u,
      permissions: JSON.parse(u.permissions || '[]')
    }));

    res.json(parsedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role, permissions } = req.body;

    const existingUser = await prisma.systemUser.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const permString = JSON.stringify(permissions || []);

    const user = await prisma.systemUser.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'STAFF',
        permissions: permString
      },
      select: { id: true, username: true, role: true, permissions: true }
    });

    res.status(201).json({ ...user, permissions: JSON.parse(user.permissions) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, permissions } = req.body;

    const data = {};
    if (username) data.username = username;
    if (role) data.role = role;
    if (permissions) data.permissions = JSON.stringify(permissions);
    
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.systemUser.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, permissions: true }
    });

    res.json({ ...user, permissions: JSON.parse(user.permissions) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.systemUser.findUnique({ where: { id } });
    if (user && user.username === 'admin') {
      return res.status(400).json({ error: 'Cannot delete the main admin account' });
    }

    await prisma.systemUser.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

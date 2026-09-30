import { prisma } from '../config/database.js';
import { verifyPassword, hashPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { Role } from '../types/index.js';

export class AuthService {
  static async login(usernameOrEmail: string, passwordPlain: string) {
    const cleanInput = usernameOrEmail.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanInput, mode: 'insensitive' } },
          { email: { equals: cleanInput, mode: 'insensitive' } },
          { name: { equals: cleanInput, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid username or password credentials.');
    }

    if (!user.isActive) {
      throw new Error('Your user account has been deactivated. Please contact CRM Admin.');
    }

    const isValidPassword = await verifyPassword(passwordPlain, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid username or password credentials.');
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Sanitized user object
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    return {
      token,
      user: sanitizedUser
    };
  }

  static async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }

  // includeInactive is only honored by admin-gated callers (checked in the
  // controller) - every other caller (owner dropdowns, filters, assignment
  // lists) must keep seeing active users only.
  static async getUsers(includeInactive = false) {
    return prisma.user.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true
      },
      orderBy: { id: 'asc' }
    });
  }

  static async createUser(data: {
    username: string;
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
  }) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email.toLowerCase() }]
      }
    });

    if (existing) {
      throw new Error('A user with this username or email already exists.');
    }

    const passwordHash = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        passwordHash,
        role: data.role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  static async updateUser(
    id: number,
    data: { name?: string; username?: string; email?: string; phone?: string | null; role?: Role; isActive?: boolean }
  ) {
    if (data.username !== undefined || data.email !== undefined) {
      const existing = await prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.username !== undefined ? [{ username: data.username }] : []),
            ...(data.email !== undefined ? [{ email: data.email.toLowerCase() }] : [])
          ]
        }
      });
      if (existing) {
        throw new Error('A user with this username or email already exists.');
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.email !== undefined && { email: data.email.toLowerCase() }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
  }

  static async resetPassword(id: number, newPassword: string) {
    const passwordHash = await hashPassword(newPassword);
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, username: true, name: true }
    });
  }

  // Hard delete. Safe to do: every FK referencing users (activities,
  // audit_logs, notifications) is ON DELETE SET NULL, so those historical
  // rows survive with userId cleared rather than being blocked or cascaded
  // away. Lead ownerId / Task assignedTo / etc. are plain name strings, not
  // FKs, so they're untouched either way.
  static async deleteUser(id: number) {
    return prisma.user.delete({
      where: { id },
      select: { id: true, username: true, name: true }
    });
  }
}

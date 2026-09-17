import { prisma } from '../config/database.js';

// Accepts either an explicit boolean (isActive/active) or the UI's
// 'Active'/'Inactive' status string, so old and new callers both work.
function resolveIsActive(data: any): boolean | undefined {
  if (data.isActive !== undefined) return Boolean(data.isActive);
  if (data.active !== undefined) return Boolean(data.active);
  if (data.status !== undefined) return data.status === 'Active';
  return undefined;
}

export class CourseService {
  static async getCourses() {
    return prisma.course.findMany({
      orderBy: { id: 'asc' }
    });
  }

  static async createCourse(data: any) {
    const existing = await prisma.course.findUnique({
      where: { code: data.code.toUpperCase() }
    });
    if (existing) {
      throw new Error(`Course with code '${data.code}' already exists.`);
    }

    return prisma.course.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name.trim(),
        description: data.description || null,
        category: data.category || null,
        duration: data.duration || null,
        price: parseFloat(data.price) || 0,
        isActive: resolveIsActive(data) ?? true
      }
    });
  }

  static async updateCourse(id: number, data: any) {
    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    const isActive = resolveIsActive(data);
    if (isActive !== undefined) updateData.isActive = isActive;

    return prisma.course.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteCourse(id: number) {
    return prisma.course.delete({
      where: { id }
    });
  }
}

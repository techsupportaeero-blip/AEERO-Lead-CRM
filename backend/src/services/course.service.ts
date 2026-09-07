import { prisma } from '../config/database.js';

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
        price: parseFloat(data.price) || 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : data.active !== undefined ? Boolean(data.active) : true
      }
    });
  }

  static async updateCourse(id: number, data: any) {
    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.active !== undefined) updateData.isActive = Boolean(data.active);

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

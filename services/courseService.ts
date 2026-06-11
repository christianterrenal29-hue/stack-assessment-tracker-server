import Course from '../models/Course';

export class CourseService {
  async createCourse(courseData: any) {
    const course = new Course({
      code: courseData.code,
      title: courseData.title,
      description: courseData.description,
      department: courseData.department,
      instructor: courseData.instructor,
      qualification: courseData.qualification,
      startDate: courseData.startDate,
      endDate: courseData.endDate,
      schedule: courseData.schedule,
      maxStudents: courseData.maxStudents || 30,
      status: courseData.status || 'active',
    });

    return await course.save();
  }

  async getCourseById(courseId: string) {
    return await Course.findById(courseId)
      .populate('department', 'name code')
      .populate('instructor', 'firstName lastName email')
      .populate('qualification', 'code title')
      .populate('enrolledStudents');
  }

  async getAllCourses(filters?: any) {
    const query: any = {};
    if (filters?.department) query.department = filters.department;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.$or = [
        { code: new RegExp(filters.search, 'i') },
        { title: new RegExp(filters.search, 'i') },
      ];
    }

    return await Course.find(query)
      .populate('department', 'name')
      .populate('instructor', 'firstName lastName')
      .populate('qualification', 'code title')
      .sort({ startDate: -1 });
  }

  async updateCourse(courseId: string, updateData: any) {
    return await Course.findByIdAndUpdate(courseId, updateData, { new: true, runValidators: true });
  }

  async enrollStudent(courseId: string, studentId: string) {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');
    if (course.enrolledStudents.includes(studentId as any)) {
      throw new Error('Student already enrolled');
    }
    if (course.enrolledStudents.length >= course.maxStudents) {
      throw new Error('Course is full');
    }

    course.enrolledStudents.push(studentId as any);
    return await course.save();
  }

  async getEnrolledStudents(courseId: string) {
    const course = await Course.findById(courseId).populate('enrolledStudents');
    return course?.enrolledStudents || [];
  }

  async deleteCourse(courseId: string) {
    return await Course.findByIdAndDelete(courseId);
  }
}

export default new CourseService();

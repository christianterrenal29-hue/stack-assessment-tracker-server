import Student, { COURSE_OPTIONS, CourseOption, YEAR_LEVEL_OPTIONS, YearLevelOption } from '../models/Student';
import { User } from '../models/User';
import { Types } from 'mongoose';
import { StudentPerformance } from '../models/StudentPerformance';
import { Submission } from '../models/Submission';

export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'dropped';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface CreateStudentInput {
  studentId: string;
  course: CourseOption;
  yearLevel: YearLevelOption;
  enrollmentDate?: Date | string;
  status?: StudentStatus;
  qualifications?: string[];
  currentCompetencies?: string[];
  completedCompetencies?: string[];
  attendancePercentage?: number;
  riskLevel?: RiskLevel;
}

export type UpdateStudentInput = Partial<CreateStudentInput>;

type StudentUpdatePayload = Omit<
  UpdateStudentInput,
  'qualifications' | 'currentCompetencies' | 'completedCompetencies'
> & {
  qualifications?: Types.ObjectId[];
  currentCompetencies?: Types.ObjectId[];
  completedCompetencies?: Types.ObjectId[];
};

export interface StudentFilters {
  status?: StudentStatus;
  riskLevel?: RiskLevel;
  course?: CourseOption;
  yearLevel?: YearLevelOption;
  search?: string;
}

const toObjectId = (id: string, fieldName: string): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return new Types.ObjectId(id);
};

const toObjectIds = (ids: string[] | undefined, fieldName: string): Types.ObjectId[] => {
  return ids?.map((id) => toObjectId(id, fieldName)) ?? [];
};

const hasObjectId = (ids: Types.ObjectId[], id: Types.ObjectId): boolean => {
  return ids.some((existingId) => existingId.equals(id));
};

const buildStudentUpdate = (updateData: UpdateStudentInput): StudentUpdatePayload => {
  if (updateData.course !== undefined) validateCourse(updateData.course);
  if (updateData.yearLevel !== undefined) validateYearLevel(updateData.yearLevel);

  return {
    ...updateData,
    qualifications: updateData.qualifications
      ? toObjectIds(updateData.qualifications, 'qualification id')
      : undefined,
    currentCompetencies: updateData.currentCompetencies
      ? toObjectIds(updateData.currentCompetencies, 'competency id')
      : undefined,
    completedCompetencies: updateData.completedCompetencies
      ? toObjectIds(updateData.completedCompetencies, 'competency id')
      : undefined,
  };
};

export const validateCourse = (course: string): CourseOption => {
  if (!COURSE_OPTIONS.includes(course as CourseOption)) {
    throw new Error('Course must be IT, HRMT, ECT, or HST');
  }

  return course as CourseOption;
};

export const validateYearLevel = (yearLevel: string): YearLevelOption => {
  if (!YEAR_LEVEL_OPTIONS.includes(yearLevel as YearLevelOption)) {
    throw new Error('Year level must be 1st Year, 2nd Year, or 3rd Year');
  }

  return yearLevel as YearLevelOption;
};

export class StudentService {
  async createStudent(userId: string, studentData: CreateStudentInput) {
    const userObjectId = toObjectId(userId, 'user id');
    const user = await User.findById(userObjectId);
    if (!user || user.role !== 'student') {
      throw new Error('User must have student role');
    }

    const course = validateCourse(studentData.course);
    const yearLevel = validateYearLevel(studentData.yearLevel);

    const existingStudent = await Student.findOne({ user: userObjectId });
    if (existingStudent) {
      throw new Error('Student record already exists for this user');
    }

    const student = new Student({
      user: userObjectId,
      studentId: studentData.studentId,
      course,
      yearLevel,
      enrollmentDate: studentData.enrollmentDate || new Date(),
      status: studentData.status || 'active',
      qualifications: toObjectIds(studentData.qualifications, 'qualification id'),
      currentCompetencies: toObjectIds(studentData.currentCompetencies, 'competency id'),
      completedCompetencies: toObjectIds(studentData.completedCompetencies, 'competency id'),
      attendancePercentage: studentData.attendancePercentage || 0,
      riskLevel: studentData.riskLevel || 'low',
    });

    return await student.save();
  }

  async getStudentById(studentId: string) {
    return await Student.findById(toObjectId(studentId, 'student id'))
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .populate('currentCompetencies')
      .populate('completedCompetencies');
  }

  async getStudentProgress(studentId: string) {
    const studentObjectId = toObjectId(studentId, 'student id');
    const student = await Student.findById(studentObjectId)
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .populate('currentCompetencies')
      .populate('completedCompetencies');

    if (!student) {
      throw new Error('Student not found');
    }

    const performance = await StudentPerformance.findOne({ student: student.user });
    const submissions = await Submission.find({ student: student.user })
      .populate('assessment')
      .sort({ submittedAt: -1 });

    return this.formatStudentProgress(student, performance, submissions);
  }

  async getStudentProgressByUserId(userId: string) {
    const student = await Student.findOne({ user: toObjectId(userId, 'user id') })
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .populate('currentCompetencies')
      .populate('completedCompetencies');

    if (!student) {
      throw new Error('Student not found');
    }

    const performance = await StudentPerformance.findOne({ student: student.user });
    const submissions = await Submission.find({ student: student.user })
      .populate('assessment')
      .sort({ submittedAt: -1 });

    return this.formatStudentProgress(student, performance, submissions);
  }

  private formatStudentProgress(student: any, performance: any, submissions: any[]) {
    const metrics = performance?.performanceMetrics;
    const completedCompetencyIds = new Set(
      student.completedCompetencies.map((competency: any) => String(competency._id ?? competency))
    );
    const currentCompetencies = [...student.currentCompetencies, ...student.completedCompetencies].map(
      (competency: any) => {
        const competencyId = String(competency._id ?? competency);
        const completed = completedCompetencyIds.has(competencyId);

        return {
          competencyId,
          code: competency.code ?? competencyId,
          title: competency.title ?? 'Competency',
          progress: completed ? 100 : 0,
          status: completed ? 'completed' : 'in_progress',
        };
      }
    );

    const gradedSubmissions = submissions.filter((submission) => submission.status === 'graded').length;
    return {
      studentId: student.studentId,
      course: student.course,
      yearLevel: student.yearLevel,
      currentCompetencies,
      assessmentPerformance: {
        totalAssessments: metrics?.totalAssessments ?? submissions.length,
        passedAssessments: metrics?.submittedAssessments ?? gradedSubmissions,
        averageScore: metrics?.averageScore ?? 0,
      },
      attendance: {
        totalClasses: 0,
        attendedClasses: 0,
        percentage: student.attendancePercentage,
      },
      riskIndicators: {
        lowAssessmentAttendance: student.attendancePercentage < 80,
        lowAssessmentScore: (metrics?.averageScore ?? 100) < 75,
        behavioralConcerns: false,
        academicStruggles: student.riskLevel === 'high',
      },
    };
  }

  async getStudentByUserId(userId: string) {
    return await Student.findOne({ user: toObjectId(userId, 'user id') })
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .populate('currentCompetencies')
      .populate('completedCompetencies');
  }

  async getAllStudents(filters?: StudentFilters) {
    const query: {
      status: StudentStatus;
      riskLevel?: RiskLevel;
      course?: CourseOption;
      yearLevel?: YearLevelOption;
      $or?: Array<{ studentId: RegExp }>;
    } = { status: 'active' };
    
    if (filters?.status) query.status = filters.status;
    if (filters?.riskLevel) query.riskLevel = filters.riskLevel;
    if (filters?.course) query.course = filters.course;
    if (filters?.yearLevel) query.yearLevel = filters.yearLevel;
    if (filters?.search) {
      query.$or = [
        { studentId: new RegExp(filters.search, 'i') },
      ];
    }

    return await Student.find(query)
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .sort({ createdAt: -1 });
  }

  async updateStudent(studentId: string, updateData: UpdateStudentInput) {
    return await Student.findByIdAndUpdate(
      toObjectId(studentId, 'student id'),
      buildStudentUpdate(updateData),
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');
  }

  async updateAttendancePercentage(studentId: string, percentage: number) {
    return await Student.findByIdAndUpdate(
      toObjectId(studentId, 'student id'),
      { attendancePercentage: Math.min(percentage, 100) },
      { new: true }
    );
  }

  async addCompetency(studentId: string, competencyId: string) {
    const student = await Student.findById(toObjectId(studentId, 'student id'));
    if (!student) throw new Error('Student not found');

    const competencyObjectId = toObjectId(competencyId, 'competency id');

    if (!hasObjectId(student.currentCompetencies, competencyObjectId)) {
      student.currentCompetencies.push(competencyObjectId);
      await student.save();
    }

    return student;
  }

  async completeCompetency(studentId: string, competencyId: string) {
    const student = await Student.findById(toObjectId(studentId, 'student id'));
    if (!student) throw new Error('Student not found');

    const competencyObjectId = toObjectId(competencyId, 'competency id');

    student.currentCompetencies = student.currentCompetencies.filter(
      (id) => !id.equals(competencyObjectId)
    );

    if (!hasObjectId(student.completedCompetencies, competencyObjectId)) {
      student.completedCompetencies.push(competencyObjectId);
    }

    return await student.save();
  }

  async updateRiskLevel(studentId: string, riskLevel: 'low' | 'medium' | 'high') {
    return await Student.findByIdAndUpdate(
      toObjectId(studentId, 'student id'),
      { riskLevel },
      { new: true }
    );
  }

  async getAtRiskStudents() {
    return await Student.find({
      $or: [
        { riskLevel: 'high' },
        { riskLevel: 'medium' },
        { attendancePercentage: { $lt: 80 } },
        { completedCompetencies: { $size: 0 } },
      ],
    })
      .populate('user', 'firstName lastName email')
      .populate('qualifications')
      .sort({ riskLevel: 1 });
  }

  async deleteStudent(studentId: string) {
    return await Student.findByIdAndDelete(toObjectId(studentId, 'student id'));
  }
}

export default new StudentService();

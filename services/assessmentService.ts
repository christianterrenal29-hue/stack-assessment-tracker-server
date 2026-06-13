import mongoose from 'mongoose';
import { Assessment, MAX_CANDIDATES_PER_SCHEDULE } from '../models/Assessment';
import Student from '../models/Student';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { validateCourse, validateYearLevel } from './studentService';

const CONFLICT_WINDOW_MS = 4 * 60 * 60 * 1000;

type ScheduleInput = {
  title: string;
  course: string;
  yearLevel: string;
  qualificationTitle: string;
  ncLevel: string;
  scheduleDateTime: string | Date;
  assessmentCenter: string;
  assessor: string;
  qualificationHandled?: string;
  candidates?: string[];
  checklist?: Record<string, unknown>;
  status?: string;
  institution?: string;
  department?: string;
  createdBy: string;
};

type CandidateUpdate = {
  attendanceStatus?: 'pending' | 'present' | 'absent';
  result?: 'pending' | 'competent' | 'not_yet_competent';
  remarks?: string;
};

const VALID_SCHEDULE_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'] as const;
const VALID_ATTENDANCE_STATUSES = ['pending', 'present', 'absent'] as const;
const VALID_RESULTS = ['pending', 'competent', 'not_yet_competent'] as const;

const assertObjectId = (id: string, label: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, `${label} is invalid`);
  }
};

const normalizeCandidateIds = (candidateIds: string[] = []) => {
  const filteredIds = candidateIds.filter(Boolean);
  const uniqueIds = Array.from(new Set(filteredIds));

  if (filteredIds.length !== uniqueIds.length) {
    throw new AppError(400, 'Duplicate candidates cannot be added to the same assessment schedule');
  }

  if (filteredIds.length > MAX_CANDIDATES_PER_SCHEDULE) {
    throw new AppError(400, `Assessment schedule cannot exceed ${MAX_CANDIDATES_PER_SCHEDULE} candidates`);
  }

  uniqueIds.forEach((id) => assertObjectId(id, 'Student ID'));
  return uniqueIds;
};

const assertValidDate = (value: string | Date, label: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${label} is invalid`);
  }
  return date;
};

const assertScheduleStatus = (status?: string) => {
  if (status && !VALID_SCHEDULE_STATUSES.includes(status as any)) {
    throw new AppError(400, 'Assessment schedule status is invalid');
  }
};

const assertCandidateUpdate = (update: CandidateUpdate) => {
  if (update.attendanceStatus && !VALID_ATTENDANCE_STATUSES.includes(update.attendanceStatus)) {
    throw new AppError(400, 'Candidate attendance status is invalid');
  }

  if (update.result && !VALID_RESULTS.includes(update.result)) {
    throw new AppError(400, 'Candidate result is invalid');
  }
};

const populateSchedule = async (query: any) => {
  return query
    .populate('assessor', 'firstName lastName email role')
    .populate('createdBy', 'firstName lastName email role')
    .populate({
      path: 'candidates.student',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('institution')
    .populate('department');
};

export class AssessmentService {
  static async getAllAssessments(filters?: any) {
    const query: any = {};

    if (filters?.assessor) query.assessor = filters.assessor;
    if (filters?.status) query.status = filters.status;
    if (filters?.course) query.course = filters.course;
    if (filters?.yearLevel) query.yearLevel = filters.yearLevel;
    if (filters?.institution) query.institution = filters.institution;
    if (filters?.department) query.department = filters.department;
    if (filters?.from || filters?.to) {
      query.scheduleDateTime = {};
      if (filters.from) query.scheduleDateTime.$gte = new Date(filters.from);
      if (filters.to) query.scheduleDateTime.$lte = new Date(filters.to);
    }

    return populateSchedule(Assessment.find(query).sort({ scheduleDateTime: 1 }).lean());
  }

  static async getAssessmentById(assessmentId: string) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    const assessment = await populateSchedule(Assessment.findById(assessmentId));

    if (!assessment) {
      throw new AppError(404, 'Assessment schedule not found');
    }

    return assessment;
  }

  static async createAssessment(scheduleData: ScheduleInput) {
    const {
      title,
      course,
      yearLevel,
      qualificationTitle,
      ncLevel,
      scheduleDateTime,
      assessmentCenter,
      assessor,
      qualificationHandled,
      candidates,
      checklist,
      status,
      institution,
      department,
      createdBy,
    } = scheduleData;

    if (!title || !course || !yearLevel || !qualificationTitle || !ncLevel || !scheduleDateTime || !assessmentCenter || !assessor || !createdBy) {
      throw new AppError(400, 'Title, course, year level, qualification, NC level, schedule date/time, venue, assessor, and creator are required');
    }

    this.assertCourseAndYear(course, yearLevel);

    assertObjectId(assessor, 'Assessor ID');
    const assessorUser = await User.findById(assessor).lean();
    if (!assessorUser || assessorUser.role !== 'assessor') {
      throw new AppError(400, 'Assigned assessor must be an accredited assessor user');
    }

    const scheduleDate = assertValidDate(scheduleDateTime, 'Schedule date/time');
    assertScheduleStatus(status);

    const candidateIds = normalizeCandidateIds(candidates);
    await this.ensureStudentsExist(candidateIds);
    await this.ensureAssessorHasNoConflict(assessor, scheduleDate);

    const assessment = new Assessment({
      title,
      course,
      yearLevel,
      qualificationTitle,
      ncLevel,
      scheduleDateTime: scheduleDate,
      assessmentCenter,
      assessor,
      assessorName: `${assessorUser.firstName} ${assessorUser.lastName}`,
      qualificationHandled: qualificationHandled || `${qualificationTitle} ${ncLevel}`,
      maxCandidates: MAX_CANDIDATES_PER_SCHEDULE,
      candidates: candidateIds.map((student) => ({ student })),
      instructor: createdBy,
      questions: [],
      checklist,
      status: status || 'scheduled',
      institution,
      department,
      createdBy,
    });

    await assessment.save();
    return this.getAssessmentById(assessment.id);
  }

  static async updateAssessment(assessmentId: string, updateData: Partial<ScheduleInput>) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment schedule not found');

    if (updateData.assessor) {
      assertObjectId(updateData.assessor, 'Assessor ID');
      const assessorUser = await User.findById(updateData.assessor).lean();
      if (!assessorUser || assessorUser.role !== 'assessor') {
        throw new AppError(400, 'Assigned assessor must be an accredited assessor user');
      }
      assessment.assessor = new mongoose.Types.ObjectId(updateData.assessor);
      assessment.assessorName = `${assessorUser.firstName} ${assessorUser.lastName}`;
    }

    const nextScheduleDate = updateData.scheduleDateTime
      ? assertValidDate(updateData.scheduleDateTime, 'Schedule date/time')
      : assessment.scheduleDateTime;
    assertScheduleStatus(updateData.status);
    if (updateData.course !== undefined || updateData.yearLevel !== undefined) {
      this.assertCourseAndYear(updateData.course ?? assessment.course, updateData.yearLevel ?? assessment.yearLevel);
    }
    await this.ensureAssessorHasNoConflict(String(assessment.assessor), nextScheduleDate, assessmentId);

    if (updateData.title !== undefined) assessment.title = updateData.title;
    if (updateData.course !== undefined) assessment.course = updateData.course as any;
    if (updateData.yearLevel !== undefined) assessment.yearLevel = updateData.yearLevel as any;
    if (updateData.qualificationTitle !== undefined) assessment.qualificationTitle = updateData.qualificationTitle;
    if (updateData.ncLevel !== undefined) assessment.ncLevel = updateData.ncLevel;
    if (updateData.scheduleDateTime !== undefined) assessment.scheduleDateTime = nextScheduleDate;
    if (updateData.assessmentCenter !== undefined) assessment.assessmentCenter = updateData.assessmentCenter;
    if (updateData.qualificationHandled !== undefined) assessment.qualificationHandled = updateData.qualificationHandled;
    if (updateData.status !== undefined) assessment.status = updateData.status as any;
    if (updateData.institution !== undefined) assessment.institution = updateData.institution as any;
    if (updateData.department !== undefined) assessment.department = updateData.department as any;
    if (updateData.checklist !== undefined) assessment.checklist = { ...assessment.checklist, ...updateData.checklist } as any;

    await assessment.save();
    return this.getAssessmentById(assessmentId);
  }

  static async deleteAssessment(assessmentId: string) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    const assessment = await Assessment.findByIdAndDelete(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment schedule not found');
    return { message: 'Assessment schedule deleted successfully' };
  }

  static async addCandidate(assessmentId: string, studentId: string) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    assertObjectId(studentId, 'Student ID');
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment schedule not found');

    if (assessment.candidates.length >= MAX_CANDIDATES_PER_SCHEDULE) {
      throw new AppError(400, `Assessment schedule cannot exceed ${MAX_CANDIDATES_PER_SCHEDULE} candidates`);
    }

    await this.ensureStudentsExist([studentId]);
    if (assessment.candidates.some((candidate) => String(candidate.student) === studentId)) {
      throw new AppError(400, 'Candidate is already included in this schedule');
    }

    assessment.candidates.push({ student: new mongoose.Types.ObjectId(studentId), attendanceStatus: 'pending', result: 'pending' });
    await assessment.save();
    return this.getAssessmentById(assessmentId);
  }

  static async removeCandidate(assessmentId: string, studentId: string) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    assertObjectId(studentId, 'Student ID');
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment schedule not found');

    assessment.candidates = assessment.candidates.filter((candidate) => String(candidate.student) !== studentId);
    await assessment.save();
    return this.getAssessmentById(assessmentId);
  }

  static async updateCandidate(assessmentId: string, studentId: string, update: CandidateUpdate) {
    assertObjectId(assessmentId, 'Assessment schedule ID');
    assertObjectId(studentId, 'Student ID');
    assertCandidateUpdate(update);
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) throw new AppError(404, 'Assessment schedule not found');

    const candidate = assessment.candidates.find((item) => String(item.student) === studentId);
    if (!candidate) throw new AppError(404, 'Candidate not found in this schedule');

    if (update.attendanceStatus) candidate.attendanceStatus = update.attendanceStatus;
    if (update.result) candidate.result = update.result;
    if (update.remarks !== undefined) candidate.remarks = update.remarks;

    await assessment.save();
    return this.getAssessmentById(assessmentId);
  }

  static async getDashboardSummary() {
    const now = new Date();
    const schedules = await Assessment.find().lean();
    const completedAssessments = schedules.filter((schedule) => schedule.status === 'completed').length;
    const upcomingSchedules = schedules.filter((schedule) => schedule.status === 'scheduled' && new Date(schedule.scheduleDateTime) >= now);
    const candidates = schedules.flatMap((schedule) => schedule.candidates);

    return {
      upcomingAssessmentSchedules: upcomingSchedules.length,
      totalCandidatesScheduled: candidates.length,
      completedAssessments,
      competentCount: candidates.filter((candidate) => candidate.result === 'competent').length,
      notYetCompetentCount: candidates.filter((candidate) => candidate.result === 'not_yet_competent').length,
      absentNoShowCandidates: candidates.filter((candidate) => candidate.attendanceStatus === 'absent').length,
      upcomingSchedules: upcomingSchedules
        .sort((a, b) => new Date(a.scheduleDateTime).getTime() - new Date(b.scheduleDateTime).getTime())
        .slice(0, 5),
    };
  }

  static async getReport(type: string) {
    const schedules = await this.getAllAssessments({});
    const rows = schedules.flatMap((schedule: any) => {
      if (type === 'assessment-schedule') return [schedule];
      return schedule.candidates.map((candidate: any) => ({ schedule, candidate }));
    });

    return {
      type,
      generatedAt: new Date(),
      totalRows: rows.length,
      data: rows,
      summary: await this.getDashboardSummary(),
    };
  }

  static async searchAssessments(query: string) {
    return populateSchedule(
      Assessment.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { course: { $regex: query, $options: 'i' } },
          { yearLevel: { $regex: query, $options: 'i' } },
          { qualificationTitle: { $regex: query, $options: 'i' } },
          { ncLevel: { $regex: query, $options: 'i' } },
          { assessmentCenter: { $regex: query, $options: 'i' } },
          { assessorName: { $regex: query, $options: 'i' } },
        ],
      }).limit(20)
    );
  }

  private static async ensureStudentsExist(studentIds: string[]) {
    if (studentIds.length === 0) return;
    const count = await Student.countDocuments({ _id: { $in: studentIds } });
    if (count !== studentIds.length) {
      throw new AppError(400, 'One or more candidates do not exist');
    }
  }

  private static assertCourseAndYear(course: string, yearLevel: string) {
    try {
      validateCourse(course);
      validateYearLevel(yearLevel);
    } catch (error) {
      throw new AppError(400, error instanceof Error ? error.message : 'Invalid course or year level');
    }
  }

  private static async ensureAssessorHasNoConflict(assessorId: string, scheduleDateTime: Date, excludeId?: string) {
    const windowStart = new Date(scheduleDateTime.getTime() - CONFLICT_WINDOW_MS);
    const windowEnd = new Date(scheduleDateTime.getTime() + CONFLICT_WINDOW_MS);
    const query: any = {
      assessor: assessorId,
      status: { $in: ['scheduled', 'ongoing'] },
      scheduleDateTime: { $gte: windowStart, $lte: windowEnd },
    };

    if (excludeId) query._id = { $ne: excludeId };

    const conflict = await Assessment.findOne(query).lean();
    if (conflict) {
      throw new AppError(409, 'Assessor has a conflicting assessment schedule within 4 hours');
    }
  }
}

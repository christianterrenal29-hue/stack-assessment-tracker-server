import mongoose, { Schema, Document } from 'mongoose';
import { COURSE_OPTIONS, CourseOption, YEAR_LEVEL_OPTIONS, YearLevelOption } from './Student';

export const MAX_CANDIDATES_PER_SCHEDULE = 10;

export type AssessmentScheduleStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type CandidateAttendanceStatus = 'pending' | 'present' | 'absent';
export type CandidateAssessmentResult = 'pending' | 'competent' | 'not_yet_competent';
export type ChecklistStatus = 'pending' | 'submitted' | 'verified' | 'missing';

export interface IAssessmentCandidate {
  student: mongoose.Types.ObjectId;
  attendanceStatus: CandidateAttendanceStatus;
  result: CandidateAssessmentResult;
  remarks?: string;
}

export interface IAssessmentChecklist {
  applicationFormSubmitted: boolean;
  selfAssessmentGuideSubmitted: boolean;
  passportPhotosSubmitted: boolean;
  assessmentFeeOrAdmissionSlip: boolean;
  attendanceSheetStatus: ChecklistStatus;
  carsRatingSheetStatus: ChecklistStatus;
}

export interface IAssessment extends Document {
  title: string;
  course: CourseOption;
  yearLevel: YearLevelOption;
  qualificationTitle: string;
  ncLevel: string;
  scheduleDateTime: Date;
  assessmentCenter: string;
  assessor: mongoose.Types.ObjectId;
  assessorName: string;
  qualificationHandled: string;
  instructor?: mongoose.Types.ObjectId;
  student?: mongoose.Types.ObjectId;
  score?: number;
  questions: mongoose.Types.ObjectId[];
  maxCandidates: number;
  candidates: IAssessmentCandidate[];
  checklist: IAssessmentChecklist;
  status: AssessmentScheduleStatus;
  institution?: mongoose.Types.ObjectId;
  department?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const candidateSchema = new Schema<IAssessmentCandidate>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    attendanceStatus: {
      type: String,
      enum: ['pending', 'present', 'absent'],
      default: 'pending',
    },
    result: {
      type: String,
      enum: ['pending', 'competent', 'not_yet_competent'],
      default: 'pending',
    },
    remarks: String,
  },
  { _id: false }
);

const checklistSchema = new Schema<IAssessmentChecklist>(
  {
    applicationFormSubmitted: { type: Boolean, default: false },
    selfAssessmentGuideSubmitted: { type: Boolean, default: false },
    passportPhotosSubmitted: { type: Boolean, default: false },
    assessmentFeeOrAdmissionSlip: { type: Boolean, default: false },
    attendanceSheetStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'missing'],
      default: 'pending',
    },
    carsRatingSheetStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'missing'],
      default: 'pending',
    },
  },
  { _id: false }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    course: { type: String, enum: COURSE_OPTIONS, required: true, index: true },
    yearLevel: { type: String, enum: YEAR_LEVEL_OPTIONS, required: true, index: true },
    qualificationTitle: { type: String, required: true, trim: true },
    ncLevel: { type: String, required: true, trim: true },
    scheduleDateTime: { type: Date, required: true, index: true },
    assessmentCenter: { type: String, required: true, trim: true },
    assessor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessorName: { type: String, required: true, trim: true },
    qualificationHandled: { type: String, required: true, trim: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User' },
    student: { type: Schema.Types.ObjectId, ref: 'Student' },
    score: Number,
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    maxCandidates: {
      type: Number,
      default: MAX_CANDIDATES_PER_SCHEDULE,
      min: MAX_CANDIDATES_PER_SCHEDULE,
      max: MAX_CANDIDATES_PER_SCHEDULE,
    },
    candidates: {
      type: [candidateSchema],
      default: [],
      validate: {
        validator(candidates: IAssessmentCandidate[]) {
          return candidates.length <= MAX_CANDIDATES_PER_SCHEDULE;
        },
        message: `Assessment schedule cannot exceed ${MAX_CANDIDATES_PER_SCHEDULE} candidates`,
      },
    },
    checklist: { type: checklistSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    institution: { type: Schema.Types.ObjectId, ref: 'Institution' },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

assessmentSchema.index({ assessor: 1, scheduleDateTime: 1 });

assessmentSchema.pre('validate', function () {
  this.maxCandidates = MAX_CANDIDATES_PER_SCHEDULE;
});

export const Assessment = mongoose.model<IAssessment>('Assessment', assessmentSchema);

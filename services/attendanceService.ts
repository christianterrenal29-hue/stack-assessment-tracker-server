import Attendance from '../models/Attendance';
import Student from '../models/Student';

export class AttendanceService {
  async recordAttendance(attendanceData: any) {
    const attendance = new Attendance({
      student: attendanceData.student,
      date: attendanceData.date || new Date(),
      status: attendanceData.status,
      hoursAttended: attendanceData.hoursAttended || 0,
      notes: attendanceData.notes,
      recordedBy: attendanceData.recordedBy,
    });

    const saved = await attendance.save();
    
    // Update student attendance percentage
    await this.updateStudentAttendancePercentage(attendanceData.student);

    return saved;
  }

  async getAttendanceById(attendanceId: string) {
    return await Attendance.findById(attendanceId)
      .populate('student', 'studentId')
      .populate('recordedBy', 'firstName lastName');
  }

  async getStudentAttendanceRecords(studentId: string, filters?: any) {
    const query: any = { student: studentId };

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    if (filters?.status) query.status = filters.status;

    return await Attendance.find(query)
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });
  }

  async getAllAttendanceRecords(filters?: any) {
    const query: any = {};

    if (filters?.student) query.student = filters.student;
    if (filters?.status) query.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate);
      if (filters.endDate) query.date.$lte = new Date(filters.endDate);
    }

    return await Attendance.find(query)
      .populate('student', 'studentId')
      .populate('recordedBy', 'firstName lastName')
      .sort({ date: -1 });
  }

  async updateAttendanceRecord(attendanceId: string, updateData: any) {
    const record = await Attendance.findByIdAndUpdate(
      attendanceId,
      updateData,
      { new: true, runValidators: true }
    ).populate('recordedBy', 'firstName lastName');

    if (record) {
      await this.updateStudentAttendancePercentage(record.student.toString());
    }

    return record;
  }

  async updateStudentAttendancePercentage(studentId: string) {
    const attendanceRecords = await Attendance.find({
      student: studentId,
      status: { $in: ['present', 'late'] },
    });

    const totalRecords = await Attendance.countDocuments({ student: studentId });

    const percentage = totalRecords > 0 
      ? (attendanceRecords.length / totalRecords) * 100 
      : 0;

    await Student.findByIdAndUpdate(
      studentId,
      { attendancePercentage: Math.round(percentage) },
      { new: true }
    );

    return percentage;
  }

  async getStudentAttendanceStats(studentId: string) {
    const records = await Attendance.find({ student: studentId });
    
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      excused: records.filter((r) => r.status === 'excused').length,
      totalHours: records.reduce((sum, r) => sum + r.hoursAttended, 0),
      attendancePercentage: records.length > 0 
        ? ((records.filter((r) => r.status === 'present' || r.status === 'late').length / records.length) * 100).toFixed(2)
        : 0,
    };

    return stats;
  }

  async deleteAttendanceRecord(attendanceId: string) {
    const record = await Attendance.findById(attendanceId);
    if (record) {
      await Attendance.findByIdAndDelete(attendanceId);
      await this.updateStudentAttendancePercentage(record.student.toString());
    }
    return record;
  }

  async getLowAttendanceStudents(threshold: number = 80) {
    return await Student.find({
      attendancePercentage: { $lt: threshold },
    }).populate('user', 'firstName lastName email');
  }
}

export default new AttendanceService();

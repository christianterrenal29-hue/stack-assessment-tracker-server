import Certificate from '../models/Certificate';
import { randomUUID } from 'crypto';

export class CertificateService {
  async issueCertificate(certificateData: any) {
    const certificate = new Certificate({
      student: certificateData.student,
      qualification: certificateData.qualification,
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      issuedDate: new Date(),
      expiryDate: certificateData.expiryDate,
      status: 'issued',
      qrCode: certificateData.qrCode || '',
      documentUrl: certificateData.documentUrl || '',
      verificationCode: randomUUID(),
    });

    return await certificate.save();
  }

  async getCertificateById(certificateId: string) {
    return await Certificate.findById(certificateId)
      .populate('student')
      .populate('qualification', 'code title');
  }

  async getStudentCertificates(studentId: string) {
    return await Certificate.find({ student: studentId })
      .populate('qualification', 'code title')
      .sort({ issuedDate: -1 });
  }

  async verifyCertificate(verificationCode: string) {
    return await Certificate.findOne({
      verificationCode,
      status: 'issued',
    }).populate('student').populate('qualification');
  }

  async revokeCertificate(certificateId: string, reason?: string) {
    return await Certificate.findByIdAndUpdate(
      certificateId,
      { status: 'revoked' },
      { new: true }
    );
  }

  async updateCertificateStatus(certificateId: string, status: 'issued' | 'revoked' | 'expired') {
    return await Certificate.findByIdAndUpdate(
      certificateId,
      { status },
      { new: true }
    );
  }

  async getAllCertificates(filters?: any) {
    const query: any = {};
    if (filters?.status) query.status = filters.status;
    if (filters?.student) query.student = filters.student;

    return await Certificate.find(query)
      .populate('student')
      .populate('qualification', 'code title')
      .sort({ issuedDate: -1 });
  }

  async deleteCertificate(certificateId: string) {
    return await Certificate.findByIdAndDelete(certificateId);
  }
}

export default new CertificateService();

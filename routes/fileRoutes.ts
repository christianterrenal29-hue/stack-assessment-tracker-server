import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import cloudinaryService from '../services/cloudinaryService';
import fileService from '../services/fileService';
import auditLogService from '../services/auditLogService';

const router = Router();

const documentRoles = ['administrator', 'instructor', 'assessor'];
const viewRoles = ['administrator', 'instructor', 'assessor', 'student'];
const documentTypes = new Set([
  'Profile Picture',
  'Valid ID',
  'Birth Certificate',
  'Self-Assessment Guide',
  'Application Form',
  'Passport Photo',
  'Admission Slip / Official Receipt',
  'Assessment Requirements',
  'Certificate',
  'Assessment Evidence',
  'Attendance Sheet',
  'Rating Sheet / CARS',
]);

router.get('/', authMiddleware, roleCheck(viewRoles), async (req: AuthRequest, res: Response) => {
  try {
    const files = await fileService.getVisibleForUser(req.user?.userId!, req.user?.role!);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load files' });
  }
});

router.get('/student/:id', authMiddleware, roleCheck(documentRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const files = await fileService.getByUploadedFor(String(req.params.id));
    res.json(files);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to load student documents' });
  }
});

router.post(
  '/upload',
  authMiddleware,
  roleCheck(documentRoles),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }

      const requirementType = documentTypes.has(String(req.body.requirementType))
        ? String(req.body.requirementType)
        : 'Assessment Requirements';
      const cloudinaryUpload = await cloudinaryService.uploadFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        documentType: requirementType,
      });

      const file = await fileService.create({
        fileName: cloudinaryUpload.original_filename || req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        url: cloudinaryUpload.secure_url,
        uploadedBy: req.user?.userId!,
        uploadedFor: String(req.body.uploadedFor || req.user?.userId),
        requirementType,
      });

      await auditLogService.create({
        user: req.user?.userId,
        action: 'upload',
        entity: 'File',
        entityId: String(file._id),
        changes: { fileName: file.originalName, requirementType: file.requirementType },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to upload file' });
    }
  }
);

router.get('/:id', authMiddleware, roleCheck(viewRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const canAccess = await fileService.canUserAccessFile(String(req.params.id), req.user?.userId!, req.user?.role!);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const file = await fileService.getById(String(req.params.id));
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load file' });
  }
});

router.get('/:id/download', authMiddleware, roleCheck(viewRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const canAccess = await fileService.canUserAccessFile(String(req.params.id), req.user?.userId!, req.user?.role!);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const file = await fileService.getById(String(req.params.id));
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.redirect(file.url);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to download file' });
  }
});

router.patch('/:id/verify', authMiddleware, roleCheck(documentRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const status = ['pending', 'verified', 'rejected'].includes(req.body.status)
      ? req.body.status
      : 'pending';
    const file = await fileService.verify(String(req.params.id), {
      status,
      remarks: req.body.remarks,
      verifiedBy: req.user?.userId!,
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    await auditLogService.create({
      user: req.user?.userId,
      action: 'verify',
      entity: 'File',
      entityId: String(file._id),
      changes: { status, remarks: req.body.remarks },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(file);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to verify file' });
  }
});

router.delete('/:id', authMiddleware, roleCheck(documentRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const file = await fileService.delete(String(req.params.id));
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    await auditLogService.create({
      user: req.user?.userId,
      action: 'delete',
      entity: 'File',
      entityId: String(file._id),
      changes: { fileName: file.originalName },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete file' });
  }
});

export default router;

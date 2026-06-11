import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { Router, Response } from 'express';
import { authMiddleware, roleCheck, AuthRequest } from '../middleware/authMiddleware';
import fileService from '../services/fileService';
import auditLogService from '../services/auditLogService';

const router = Router();
const uploadDir = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PDF, DOCX, JPG, and PNG files are allowed'));
      return;
    }
    callback(null, true);
  },
});

const documentRoles = ['administrator', 'instructor', 'assessor'];

router.get('/', authMiddleware, roleCheck(documentRoles), async (_req: AuthRequest, res: Response) => {
  try {
    const files = await fileService.getAll();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load files' });
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

      const file = await fileService.create({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        storagePath: req.file.path,
        uploadedBy: req.user?.userId!,
        uploadedFor: String(req.body.uploadedFor || req.user?.userId),
        requirementType: String(req.body.requirementType || 'TESDA Requirement'),
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

router.get('/:id', authMiddleware, roleCheck(documentRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
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

router.get('/:id/download', authMiddleware, roleCheck(documentRoles), async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const file = await fileService.getById(String(req.params.id));
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    res.download(file.storagePath, file.originalName);
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

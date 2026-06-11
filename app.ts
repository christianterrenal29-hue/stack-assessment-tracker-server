import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database';
import mongoose from './config/database';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import institutionRoutes from './routes/institutionRoutes';
import departmentRoutes from './routes/departmentRoutes';
import studentRoutes from './routes/studentRoutes';
import assessmentRoutes from './routes/assessmentRoutes';
import submissionRoutes from './routes/submissionRoutes';
import questionRoutes from './routes/questionRoutes';
import rubricRoutes from './routes/rubricRoutes';
import competencyRoutes from './routes/competencyRoutes';
import qualificationRoutes from './routes/qualificationRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import ojtRoutes from './routes/ojtRoutes';
import courseRoutes from './routes/courseRoutes';
import certificateRoutes from './routes/certificateRoutes';
import riskMonitoringRoutes from './routes/riskMonitoringRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import riskSchedulerRoutes from './routes/riskSchedulerRoutes';
import fileRoutes from './routes/fileRoutes';
import auditLogRoutes from './routes/auditLogRoutes';

const app: Application = express();

// Middleware
app.use(cors({
  origin: config.CLIENT_URLS,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rubrics', rubricRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/qualifications', qualificationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ojt', ojtRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/risk-monitoring', riskMonitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/scheduler', riskSchedulerRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  const port = config.PORT;
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  try {
    await connectDatabase();
  } catch (error) {
    console.error('Server started without database connection:', error);

    if (config.NODE_ENV === 'production') {
      server.close(() => process.exit(1));
    }
  }
};

export default app;

// Start the server if this is the main module
if (require.main === module) {
  startServer();
}

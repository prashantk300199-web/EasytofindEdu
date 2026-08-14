import { Router } from 'express';
import { googleLogin } from '../controllers/google.auth.controller.js';

const router = Router();

// POST /api/v1/auth/google
// Body: { idToken: string, role: 'student' | 'owner' | 'institute_owner' }
router.post('/google', googleLogin);

export default router;

import { Router } from 'express';
import { googleLogin } from '../controllers/google.auth.controller.js';
import validate from '../middlewares/validate.js';
import { googleLoginSchema } from '../validators/google.auth.validator.js';

const router = Router();

// POST /api/v1/auth/google
// Body: { idToken: string, role: 'student' | 'owner' | 'institute_owner' }
router.post('/google', validate(googleLoginSchema), googleLogin);

export default router;

import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth';
import { requireMinRole } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { updateUserSchema, updateStatusSchema, updateRoleSchema, userQuerySchema } from './users.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Self routes
router.get('/me', usersController.getMe);
router.put('/me', validate(updateUserSchema), usersController.updateMe);

// User listing (filtered by role jurisdiction)
router.get('/', validate(userQuerySchema, 'query'), usersController.getUsers);
router.get('/leaderboard', usersController.getLeaderboard);

// Specific user routes
router.get('/:id', usersController.getUserById);
router.put('/:id', requireMinRole('LGA_COORDINATOR'), validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', requireMinRole('LGA_COORDINATOR'), usersController.deleteUser);
router.put('/:id/status', requireMinRole('LGA_COORDINATOR'), validate(updateStatusSchema), usersController.updateStatus);
router.put('/:id/role', requireMinRole('STATE_COORDINATOR'), validate(updateRoleSchema), usersController.updateRole);

export default router;

import express from 'express';
import userRoutes from './userRoutes.js';
import authGoogle from './authGoogle.js'

const router = express.Router();

router.use('/api/users', userRoutes);
router.use('/api/auth', authGoogle);


export default router;

import express from 'express';
import authRoutes from './auth.route.js';
import usersRoutes from './users.route.js';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users',usersRoutes);


export default router;
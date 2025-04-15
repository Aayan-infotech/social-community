import express from 'express';
import authRoutes from './auth.route.js';
import usersRoutes from './users.route.js';
import postsRoutes from './posts.route.js';
import jobRoutes from './job.route.js';
import familyRoutes from './family.route.js';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users',usersRoutes);
router.use('/posts',postsRoutes);
router.use('/jobs',jobRoutes);
router.use('/family', familyRoutes);


export default router;
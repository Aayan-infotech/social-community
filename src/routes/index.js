import express from 'express';
import authRoutes from './auth.route.js';
import usersRoutes from './users.route.js';
import postsRoutes from './posts.route.js';
import jobRoutes from './job.route.js';
import familyRoutes from './family.route.js';
import healthWellnessRoutes from './health_wellness.route.js';
import nearbyRoutes from './nearby.route.js';
import marketPlacesRoutes from './marketplace.route.js';
import chatRoutes from './chat.route.js';
import virtualEventsRoutes from './virtualEvent.route.js';
import interestRoutes from './interest.route.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/posts', postsRoutes);
router.use('/jobs', jobRoutes);
router.use('/family', familyRoutes);
router.use('/health-wellness', healthWellnessRoutes);
router.use('/nearby', nearbyRoutes);
router.use('/marketplace', marketPlacesRoutes);
router.use('/chat', chatRoutes);
router.use('/virtual-events',virtualEventsRoutes);
router.use('/interests', interestRoutes);

export default router;
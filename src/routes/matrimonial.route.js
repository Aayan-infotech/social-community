import { Router } from "express";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addFamilyDetailsSchema, addIndentyProofDocumentSchema, addMatrimonialSchema } from "../validators/matrimonialValidator.js";
import { addFamilyDetails, addIndentyProofDocument, addMatrimonialProfile, getAllProfiles, getColleges, getCommunities, getCompanies, getDegrees, getPositions, getProfileById, getSubCommunities } from "../controllers/matrimonial.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";


const router = Router();

router.post('/add',verifyJWT,upload.fields([{ name: 'profilePicture', maxCount: 3 }]),validateRequest(addMatrimonialSchema),errorHandler,addMatrimonialProfile);
router.get('/getCommunity', verifyJWT, getCommunities);
router.get('/getSubCommunity/:communityId',verifyJWT,getSubCommunities);
router.get('/getDegrees', verifyJWT, getDegrees);
router.get('/getColleges', verifyJWT, getColleges);
router.get('/getCompanies', verifyJWT, getCompanies);
router.get('/getPositions', verifyJWT, getPositions);
router.get('/getAllProfiles', verifyJWT, getAllProfiles);
router.get('/getProfile/:profileId', verifyJWT, getProfileById);
router.post('/addIdentityProof/:profileId', verifyJWT, upload.fields([{ name: 'identityProofDocument', maxCount: 1 }]),validateRequest(addIndentyProofDocumentSchema),errorHandler, addIndentyProofDocument);
router.post('/addfamilyDetails/:profileId', verifyJWT,validateRequest(addFamilyDetailsSchema),errorHandler, addFamilyDetails);

export default router;

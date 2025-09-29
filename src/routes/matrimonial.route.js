import { Router } from "express";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addFamilyDetailsSchema,
  addIndentyProofDocumentSchema,
  addMatrimonialSchema,
  desiredPartnersSchema,
  saveHobbiesSchema,
  sendInterestSchema,
  updateAboutSchema,
  updateBasicDetailsSchema,
  updateCareerSchema,
  updateEducationSchema,
  updateFamilySchema,
  updateHoroscopeSchema,
  updateLifeStyleSchema,
  updateMatrimonialSchema,
} from "../validators/matrimonialValidator.js";
import {
  acceptRejectInterest,
  addFamilyDetails,
  addIndentyProofDocument,
  addMatrimonialProfile,
  desiredPartner,
  getAllCountries,
  getAllProfiles,
  getCitiesByState,
  getColleges,
  getCommunities,
  getCompanies,
  getDegrees,
  getInterestedProfiles,
  getMatrimonialProfileSuggesstions,
  getPositions,
  getProfileById,
  getStatesByCountry,
  getSubCommunities,
  saveHobbies,
  sendInterest,
  updateAbout,
  updateBasicDetails,
  updateCareer,
  updateEducation,
  updateFamily,
  updateHoroscope,
  updateLifestyle,
  updateMatrimonialProfile,
} from "../controllers/matrimonial.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import errorHandler from "../middlewares/errorhandler.middleware.js";

const router = Router();

router.post(
  "/add",
  verifyJWT,
  upload.fields([{ name: "profilePicture", maxCount: 3 }]),
  validateRequest(addMatrimonialSchema),
  errorHandler,
  addMatrimonialProfile
);
router.get("/getCommunity", verifyJWT, getCommunities);
router.get("/getSubCommunity/:communityId", verifyJWT, getSubCommunities);
router.get("/getDegrees", verifyJWT, getDegrees);
router.get("/getColleges", verifyJWT, getColleges);
router.get("/getCompanies", verifyJWT, getCompanies);
router.get("/getPositions", verifyJWT, getPositions);
router.get("/getAllProfiles", verifyJWT, getAllProfiles);
router.get("/getProfile/:profileId", verifyJWT, getProfileById);
router.post(
  "/addIdentityProof/:profileId",
  verifyJWT,
  upload.fields([{ name: "identityProofDocument", maxCount: 1 }]),
  validateRequest(addIndentyProofDocumentSchema),
  errorHandler,
  addIndentyProofDocument
);
router.post(
  "/addfamilyDetails/:profileId",
  verifyJWT,
  validateRequest(addFamilyDetailsSchema),
  errorHandler,
  addFamilyDetails
);
router.patch(
  "/updateProfile/:profileId",
  verifyJWT,
  upload.fields([
    { name: "identityProofDocument", maxCount: 1 },
    { name: "profilePicture", maxCount: 3 },
  ]),
  validateRequest(updateMatrimonialSchema),
  errorHandler,
  updateMatrimonialProfile
);

router.get("/countries", verifyJWT, getAllCountries);
router.get("/states/:countryCode", verifyJWT, getStatesByCountry);
router.get("/cities/:countryCode/:stateCode", verifyJWT, getCitiesByState);

router.get(
  "/getSuggestion/:profileId",
  verifyJWT,
  getMatrimonialProfileSuggesstions
);
router.post(
  "/hobbies/:profileId",
  verifyJWT,
  validateRequest(saveHobbiesSchema),
  saveHobbies
);
router.post(
  "/sendInterest/:profileId",
  verifyJWT,
  validateRequest(sendInterestSchema),
  sendInterest
);
router.put("/acceptRejectInterest", verifyJWT, acceptRejectInterest);
router.get(
  "/getInterestedProfile/:profileId",
  verifyJWT,
  getInterestedProfiles
);

router.put(
  "/basicDetails/:profileId",
  verifyJWT,
  validateRequest(updateBasicDetailsSchema),
  updateBasicDetails
);
router.put(
  "/updateAbout/:profileId",
  verifyJWT,
  validateRequest(updateAboutSchema),
  updateAbout
);

router.put(
  "/updateEducation/:profileId",
  verifyJWT,
  validateRequest(updateEducationSchema),
  updateEducation
);

router.put(
  "/updateCareer/:profileId",
  verifyJWT,
  validateRequest(updateCareerSchema),
  updateCareer
);
router.put(
  "/updatefamilyDetails/:profileId",
  verifyJWT,
  validateRequest(updateFamilySchema),
  updateFamily
);

router.put(
  "/updateHoroscope/:profileId",
  verifyJWT,
  validateRequest(updateHoroscopeSchema),
  updateHoroscope
);

router.put(
  "/updateLifestyle/:profileId",
  verifyJWT,
  validateRequest(updateLifeStyleSchema),
  updateLifestyle
);

router.post('/desirePartners/:profileId',verifyJWT,validateRequest(desiredPartnersSchema),desiredPartner);

export default router;


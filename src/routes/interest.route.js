import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { addInterestCategorySchema, addInterestSchema } from "../validators/interestValidator.js";
import { addInterest, addInterestCategory, getInterestCategoryList, getInterestList } from "../controllers/interest.controller.js";



const router = Router();

router.post('/addCategory', verifyJWT, validateRequest(addInterestCategorySchema), addInterestCategory);
router.post('/add', verifyJWT, validateRequest(addInterestSchema), addInterest);

router.get('/categoryList',verifyJWT,getInterestCategoryList);
router.get('/list/:categoryId',verifyJWT,getInterestList);

export default router;

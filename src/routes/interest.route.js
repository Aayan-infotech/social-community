import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import { addInterestCategorySchema, addInterestSchema, addUserInterestSchema } from "../validators/interestValidator.js";
import { addInterest, addInterestCategory, getInterestCategoryList, getInterestList, addUserInterest, getInterestCategory, updateInterestCategory, getInterests , updateInterest } from "../controllers/interest.controller.js";



const router = Router();

router.post('/addCategory', verifyJWT, validateRequest(addInterestCategorySchema), addInterestCategory);
router.get('/getCategory', verifyJWT, getInterestCategory);
router.put('/updateCategory/:id', verifyJWT, validateRequest(addInterestCategorySchema), updateInterestCategory);


router.post('/add', verifyJWT, validateRequest(addInterestSchema), addInterest);
router.get('/list', verifyJWT, getInterests);
router.put('/update/:id', verifyJWT, validateRequest(addInterestSchema), updateInterest);

router.get('/categoryList', verifyJWT, getInterestCategoryList);
router.get('/list/:categoryId', verifyJWT, getInterestList);
router.put('/addUserInterests', verifyJWT, validateRequest(addUserInterestSchema), addUserInterest);

export default router;

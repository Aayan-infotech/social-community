// const errorHandler = (err, req, res, next) => {
//     if (res.headersSent) {
//       return next(err);
//     }
//     res.status(err.statusCode || 500).json({
//       status: "error",
//       statusCode: err.statusCode || 500,
//       message: err.message || "Internal server error",
//     });
//   };

import { ApiError } from "../utils/ApiError.js";

  
//   export default errorHandler;


const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: err.success,   
            data:null,        
        });
    }

    res.status(err.statusCode || 500).json({
        statusCode: err.statusCode || 500,
        message: err.message || "Internal server error",
        success: false, 
        data: null    
    });
};

export default errorHandler;

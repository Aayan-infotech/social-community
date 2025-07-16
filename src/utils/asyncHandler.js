// Desc: Async Handler for handling async functions
import fs from 'fs';
function asyncHandler(fn) {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            if (req.files) {
                const keyNames = Object.keys(req.files)[0];
                if (keyNames) {
                    for (const file of req.files[keyNames]) {
                        if (file.path && fs.existsSync(file.path)) {
                            try {
                                fs.unlinkSync(file.path);
                            } catch (unlinkErr) {
                                console.warn("File deletion failed in asyncHandler:", unlinkErr.message);
                            }
                        }
                    }
                }
            }
            res.status(error.statusCode || 500).json({
                statusCode: error.statusCode || 500,
                data: null,
                message: error.message || 'Internal Server Error',
                success: false,
            });
        }
    }
}
export { asyncHandler }
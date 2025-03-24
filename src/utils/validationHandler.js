const validateSchema =async(schema, data) => {
    try {
        await schema.validateAsync(data, { abortEarly: false });
        return null;
    } catch (error) {
        if (error.isJoi) {
            const validationErrors = error.details.map((err) => err.message);
            return validationErrors;
        }
        throw error;
    }
};

export { validateSchema };
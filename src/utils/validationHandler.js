const validateSchema = async (schema, data) => {
    try {
      await schema.validateAsync(data, { abortEarly: true }); 
      return null;
    } catch (error) {
      if (error.isJoi) {
        console.log(error);
        return error.details[0].message; 
      }
      throw error;
    }
  };
  
  export { validateSchema };
  
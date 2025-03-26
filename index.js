import "./bootstrap.js";
const { default: connectDB } = await import("./src/db/index.js");
const { app } = await import("./src/app.js");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3030, () => {
      console.log(`Server started on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Mongo DB connection failed!!! ${err}`);
  });


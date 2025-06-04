import "./bootstrap.js";
const { default: connectDB } = await import("./src/db/index.js");
const { app } = await import("./src/app.js");
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 3030;

try {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });

  initSocket(server);
} catch (err) {
  console.log(`Mongo DB connection failed!!! ${err}`);
}

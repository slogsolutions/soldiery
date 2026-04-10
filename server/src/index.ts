import express from "express";
import assignmentRoutes from "./routes/assignment.js"
import dotenv from "dotenv"
import dbConnection from "./config/dbconnection.js";

const app = express();
dotenv.config()

app.use(express.json());


app.use("/api/assignments", assignmentRoutes );

const port = process.env.PORT

dbConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`server is running at ${port}`);
    });
  })
  .catch((err: string) => {
    console.error("Database connection failed:", err);
  });
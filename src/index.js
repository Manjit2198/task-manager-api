const express = require("express")
require("./db/mongoose")

// const User = require("./models/users");
// const Task = require("./models/tasks");
const userRoute = require("./routes/users")
const taskRoute = require("./routes/tasks")
const app = express();
const dotenv = require("dotenv");

app.use(express.json());
dotenv.config();

const port = process.env.PORT;
app.use(userRoute);
app.use(taskRoute);

app.listen(port,()=>{
    console.log("listening to the port ",+ port)
})
const mongoose = require("mongoose");
const validator = require("validator")
const dotenv = require("dotenv")
dotenv.config();

mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology: true
},()=>{
    console.log("database connected successfully");
})




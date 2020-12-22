const mongoose = require("mongoose");
const validator= require("validator");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");



const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim: true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("email is invalid")
            }
        }  
    },
    password:{
        type:String,
        required:true,
        minLength:7,
        trim:true,
        validate(value){
            if(value.toLowerCase().includes("password"))
            {
                throw new Error("Password can't contain the string password")
            }
        }
    },
    age:{
        type:Number,
        default:9
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }],
    avatar:{
        type:Buffer
    }
},

{
    timestamps:true
})

userSchema.virtual("tasks",{
    ref:"Task",
    localField:"_id",
    foreignField:"owner"
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
        delete userObject.password
        delete userObject.tokens
        delete userObject.avatar
        return userObject
    
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user._id.toString() }, process.env.TOKEN_SECRET_KEY)
    user.tokens = user.tokens.concat({token})
     await user.save()
     
    return token 
}

userSchema.pre("save", async function(next){
    const user = this
    if(user.isModified("password")){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
});

const User = mongoose.model("User", userSchema);

module.exports = User;
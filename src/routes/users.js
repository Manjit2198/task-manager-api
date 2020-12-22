const express = require("express");
const User = require("../models/users");
const bcrypt = require("bcryptjs")
const auth = require("../middlewares/auth");
const Task = require("../models/tasks")
const multer = require("multer");
const sharp = require("sharp")
const { sendWelcomeEmail, sendCancelationEmail} = require("../emails/account")
const router = new express.Router();


//create user
router.post("/users", async(req, res)=>{
    
    
    try{
    const emailExist = await User.findOne({ email: req.body.email });

        if(emailExist){
        return res.status(201).json({
            message:"email already exists"
        })
    }
        const user = new User(req.body);
        await user.save()
        const token = await user.generateAuthToken()
        res.send({user, token})
    }catch(e){
        res.status(500).send(e)
    }
})

//login
router.post("/users/login", async(req, res)=>{
    try{
        const user = await User.findOne({ email: req.body.email })
        if (!user) return res.status(400).send("email or password is wrong");
        
        //passsword validation
        const validPass = await bcrypt.compare(req.body.password, user.password);
        
        if (!validPass) 
        {
            return res.status(400).send("password invalid");
        }
        
        
         const token = await user.generateAuthToken();
        await user.save()

        
        res.send({user, token});        
    }catch(e){
        res.status(500).send("unable to login")
}
})

router.post("/users/logout", auth, async(req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send("logged out");
    }catch(e){
        res.status(401).send("something is wrong")
    }
})

//logout user from all places
router.post("/users/logoutAll", auth, async(req, res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send("completely logged out")
    }catch(e){
        res.status(400).send("something is fishy")
    }
})

router.get("/users/me", auth, async(req, res)=>{
    res.status(200).send(req.user);
})


// update user
router.patch("/users/:id", auth, async(req,res)=>{
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name","email","password","age"]
    const isValidOperation = updates.every((update)=>
        allowedUpdates.includes(update)
        )
        if(!isValidOperation){
         return res.status(400).send("Error: invalidUpdates")   
        }
    try{
        updates.forEach((update)=> req.user[update] = req.body[update])
        await req.user.save();

        if(!user){
            return res.status(404).send("not a user")
        }
        res.send(req.user)

    }catch(error){
        res.status(500).send(error)

    }
})

//delete user
router.delete("/users/me", auth, async(req, res)=>{
    
    try{
        await req.user.remove();
        await Task.deleteMany({ owner:req.user._id });
        res.send(req.user)
    next()
    }catch(e){
        res.status(400).send(e)
    }
})

const upload = multer({
    
    limits:{
        fileSize:1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("please upload an image"))
        }
        cb(undefined, true)
    }
})

//upload profile picture
router.post("/users/me/avatar",auth, upload.single("avatar"), async(req, res) =>{
    const buffer = await sharp(req.file.buffer).resize({ width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send(req.user)

},(error, req, res, next)=>{
    res.status(400).send({error:error.message})
})


//delete profile picture


router.delete("/users/me/avatar", auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})
router.get("/users/:id/avatar", async(req, res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set("Content_Type","image/jpg")
        res.send(user.avatar)
    }
    catch(e){
        res.status(400).send(e)
    }
})

module.exports = router
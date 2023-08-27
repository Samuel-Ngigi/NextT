//Connection to the database.
const express = require ("express");
const https = require("https");
const bodyParser =require("body-parser")
const ejs = require("ejs");
const joi = require("joi");
const router = express.Router();



const { Schema, default: mongoose } = require("mongoose");
const { stringify } = require("querystring");
const { log } = require("console");
const { error } = require("console");
const { validateHeaderValue } = require("http");
const { Http2ServerRequest } = require("http2");

const app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.set("view engine", "ejs")

mongoose.connect("mongodb://127.0.0.1:27017/NextTUsersDB");
//std user collection defination
const NextTUsersSchema = new mongoose.Schema(
    {
        name:String,
        phone: String,
        floor: String,
        roomNo: String,
        month: String,
        connectedDevices: Array,
        bill: String,
        bal: String,
        status: String,
        updatedOn: String,
        
     }
)
const StandardUsersSiteA = new mongoose.model("NextTUsersModel", NextTUsersSchema)


app.get("/", function(req, res){
res.render("home.ejs");
})
app.get("/addUser", function(req, res){
    res.render("addUser.ejs");
})
app.post("/registerUser", function(req, res){
    const nextTregistration = new StandardUsersSiteA({
     name: req.body.name,
     phone: req.body.username,
     floor: req.body.roomNo,
     month: req.body.month,
     connectedDevices: req.body.connectedDevices,
     bill: req.body.bill,
     bal: req.body.bal,
     status: req.body.status,
     updatedOn: req.body.updatedOn,
    })
    nextTregistration.save()
    .then(function(){
        console.log("added one user information")
        res.render("addUser")
    })
    .catch(function(err){
        console.log(err)
    })
   
})


//user acounts
const userAccounts2 = new mongoose.Schema({
    name:{
      type: String,
      require: true,
      minlength: 5,
      maxlength: 50,
      unique: true,
    },
    password : {
         type: String,
        required: true,
        minlength: 5,
        maxlength: 1024,
    }
})
const userAc2 = new mongoose.model("userAc2Model", userAccounts2)

app.post("/userAccount2fm", async(req, res)=>{
    let name = req.body.name
    let password = req.body.password
    //validate the the form input so as to make sure they match with the rules you have set in your db schema.
const joischema = joi.object({
  name: joi.string().min(5).max(50).required(),
  password: joi.string().min(5).max(255).required()
})
const {error} = joischema.validate(req.body);
if (error){
    const errorDetails = error.details.map(detail=>detail.message)
    res.render("validationErrorUser.ejs", {errormsg: errorDetails})
    return;
}

   //Check if the user already exist

    let user = await userAc2.findOne({name: req.body.name});
    if (user){
        return res.status(400).send("That user already exist");
    }
    else{

    //  insert the new user if they do not exist

     newUser = new userAc2({
        name: req.body.name,
        password:req.body.password
     });
     await newUser.save();
     console.log(newUser)
     res.send("Successfully added one user")
    }
 })

//cation: This page can be accessed through a route
app.get("/addUserAccount", function(req, res){
    res.render("newuserAccount")
})

app.get("/newUserAccountAdded", function(req, res){
    res.render("newuserAccount")
})


//authenticate connection to the wi-fi network
app.post("/authenticateConnection", function(req, res){
    const name = req.body.username
    const password = req.body.password
   
    userAc2.findOne({name: name})
   .then ( (foundUser)=>{
       if (foundUser === null || undefined){
    console.log("The user wasn't found")
    res.send("<h3>Sorry, the User does not exist. Contact the admin!</h3>")
   }
     else{
        if(foundUser.name===name){
        if(foundUser.password===password){
            console.log("User account has successfully been authenticated")
            console.log("status code " + res.statusCode)
            const statusCode = res.statusCode
             res.render("connected", {stcode:statusCode})
        }else{
            res.send("<h3>Incorrect password!</h3>")
        }
    }}
 })
.catch(function(err){
    console.log( err)
})

})
//Finding user accounts
app.get("/findUserAcs", async(req, res)=>{
    let users = await userAc2.find({},{ name: true, password: true})
    res.send(users)
}) 
//remove a user
app.get("/removeUser", function(req, res){
    res.render("removeUserfm")
})
app.post("/removeUserfm", async(req,res)=>{
    let name = req.body.name;
    let user = await userAc2.findOne({name:name})
    if(user){
        await userAc2.deleteOne(user)
        res.send("<h2>Successfully removed the specified user")
         console.log(user)
    }
    else{
    res.send("<h2>Sorry, the specified user does not exist")
       }
})
//Update a user account
app.get("/updateUserac", function(req, res){
    res.render("updateUserfm")
})
app.post("/updateUserfm", async(req, res)=>{
    let cname = req.body.cname
    let nname = req.body.nname
    let cpassword = req.body.cpassword
    let npassword = req.body.npassword
    let user = await userAc2.findOne({name: cname}, {name:true, password:true})
    if(user){
        console.log(user);
        if(user.password===cpassword){

           const joischema = joi.object({
             nname: joi.string().min(5).max(50).required(),
             npassword: joi.string().min(5).max(255).required()
            })
            const {error} = joischema.validate(req.body);
            if (error){
                const errorDetails = error.details.map(detail=>detail.message)
                res.render("validationErrorUser.ejs", {errormsg: errorDetails})
            return;
        }        
            userAc2.updateMany({name: cname}, {$set:{name: nname}})
            userAc2.updateOne({password: cpassword}, {$set: {password: npassword}})
            res.send("<h2>Successfully updated user details</h2>")
        }
        else{
            res.send("Sorry, your current password field did not match")
        }
    }
    else{
        res.send("<h2>Sorry, the detail you entered does not match any user.</h2>")
    }
})





//Admin collection defination
const NextTAdminSchema = new mongoose.Schema(
    {
        username: String,
        password: String,
    }
)
const NextTadmin = new mongoose.model("NextTAdminModel", NextTAdminSchema );
app.post("/addAdmin", function(req, res){
    const addedAdmin = new NextTadmin({
        username: req.body.username,
        password: req.body.password
     })
     addedAdmin.save()
    .then(function(){
        console.log("Successfully added another admin")
        res.render("addUser");
    })
      
})



app.get("/loginAdmin", function(req, res){
    console.log("admin page is being rendered")
    res.render("loginAdmin.ejs");
});

app.post("/authenticateAdmin", function(req, res){
const username = req.body.username
const password = req.body.password

NextTadmin.findOne({username: username})
.then ( (foundUser)=>{
     if (foundUser === null || undefined){
    console.log("The user wasn't found")
     res.render("adminlnFailure");
   } else{
        if(foundUser){
        if(foundUser.password===password){
            console.log("admin has successfully been authenticated")
             res.render("addUser")
        }
        else{
             res.send("<h3>Incorrect password! Try again</h3>")
        }
    }}
 },   (err)=>{
   console.log(err) 
}
)
})

//caution! This page is accessible through a route
app.get("/addAdmin", function(req, res){
res.render("addAdmin")
})

const port = process.env.port;
app.listen(port || 3000, function(err){
    if(err){
        console.log(err)
    }
    else{
        console.log("The serve is running on port 3000")
    }
})


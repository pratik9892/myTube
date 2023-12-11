// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({path : "./env"})

connectDB()





















/*
import express from "express"

const app = express()

( async () => {
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
       app.on("error" , (err) => {
        console.log("ERROR :",err);
       })
       app.listen(process.env.PORT , () => {
        log(`App is listening on ${process.env.PORT}`)
       })
    } catch (error) {
        console.log("Error : ",error);
        throw error;
    }
} )()
*/
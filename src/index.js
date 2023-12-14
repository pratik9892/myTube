// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({path : "./.env"})

connectDB()
.then( () => {
    app.on("error" , (err) => {
        console.log("Error : " , err);
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at Port : ${process.env.PORT}`);
    })
} )
.catch( (error) => {
    console.log("mongodb connection failed : ", error);
} )





















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
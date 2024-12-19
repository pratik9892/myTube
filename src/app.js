import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({limit:"50mb",extended:true}));
app.use(express.static("public"));
app.use(cookieParser())

app.get("/home" , (req,res) => {
    return res.json("Hello from home")
})

//user routes
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

//routes declaration
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/users" , videoRouter)
app.use("/api/v1/users" , subscriptionRouter)

// http://localhost:8000/api/v1/users
export { app }; 
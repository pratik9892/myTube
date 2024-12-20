import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";

const healthCheck = asyncHandler(async(requestAnimationFrame,res) => {
    return res
    .status(200)
    .json(
        new apiResponse(200,{message:"Everthing is OK"},"OK")
    )
})

export {
    healthCheck
}
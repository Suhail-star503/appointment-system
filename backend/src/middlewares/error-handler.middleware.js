// Error handling middleware all errors are handled here

import ApplicationError from "../errors/applicationError.js";
import mongoose from "mongoose";

export const errorHandlerMiddleware = (err,req,res,next)=>{
    // Handling other potential errors
    console.error(err); // Log the error for debugging purposes

    if (err instanceof ApplicationError) {
        // Handle custom application errors
        return res.status(err.statuscode).json({ success: false, error: err.message });
    }

    if (err instanceof mongoose.Error.ValidationError) {
        // Handle Mongoose validation errors
        return res.status(400).json({ success: false, error: err.message });
    }
    
    // Send a generic error response for unhandled errors
    res.status(500).json({ success: false, error: "Oops! Something went wrong... Please try again later!" });
}
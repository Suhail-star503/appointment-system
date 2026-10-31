
import mongoose from "mongoose";

const connectUsingMongoose=async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongoose is connected");

    }catch(err){
        console.log(err);
    }
}
export default connectUsingMongoose;
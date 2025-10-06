import mongoose from "mongoose";
import { db_name } from "../constants.js";
const dbconnect=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${db_name}`);
        console.log(`DB connects successfully !! DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDb connection Error: ",error);
        process.exit(1);
    }
}
export default dbconnect;

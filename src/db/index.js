import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // app.on("error",(error)=>{
        //             console.log("ERRR: ",error);
        //             throw error;
        //           })
        console.log(`\n MONGODB connected !! DB HOST ${connectionInstance.connection.host}`);
        //console.log(`\n ${connectionInstance}`);
    }catch(errror){
        console.log("MONGODB connection error", error);
        process.exit(1)
    }
}

export default connectDB
import { AppError } from "./AppErorr.js";

const errorHandler =(controller)=>{
    return(req,res,next)=>{
         controller(req,res,next).catch(err=>{
              if (err.code === 11000) {
                if (err.keyPattern.email) {
                    return next(new AppError( "Email already exists." ,401));
                }
            }
            return next(new AppError( `${err}`,500));
         });
    }
}
export default errorHandler;


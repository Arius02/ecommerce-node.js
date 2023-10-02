

export const globalMiddleware=(err,req,res,next)=>{
        let error = err.message
        let code= err.statusCode ||500
        let stack= err.stack
        let status= err.status || "error"
        return process.env.ENVIROMENT=="development"? res.status(code).json({error,status,stack}):
               res.status(code).json({error,status })
    }

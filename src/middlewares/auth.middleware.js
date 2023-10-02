import { userModel } from "../../database/models/user.model.js";
import { AppError } from "../utils/AppErorr.js";
import getToken from "../utils/bearerToken.js";
import errorHandler from "../utils/errorHandler.js";
import { verifyToken } from "../utils/token.js";

const auth = () => {
  return errorHandler(async (req, res, next) => {
    const bearerToken = req.header("authorization");
    if (!bearerToken) return next(new AppError("token not found", 401));

    const { isBearer, token } = getToken(bearerToken);
    if (!isBearer) return next(new AppError("invalid token format", 401));

    const decoded = verifyToken({
      token,
      signature: process.env.TOKEN_SECRET_KEY,
    });
    if (!decoded?._id) return next(new AppError("invalid token payload", 400));

    const user = await userModel.findById(decoded._id);
    if (!user?.isConfirmed)
      return next(new AppError("user is not found or not confirmed", 404));
    if (parseInt(user.passwordChangedAt?.getTime() / 1000) > decoded.iat) {
      return next(
        new AppError(
          "token expired after change password please login again with new password"
        )
      );
    }
    req.user = user;
    next();
  });
};
export default auth;

export const allowTo = (roles) => {
  return errorHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("Your are not authorized to access this route.", 401)
      );
    }
    next();
  });
};

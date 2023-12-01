import errorHandler from "../../utils/errorHandler.js";
import bcrypt from "bcrypt";
import { userModel } from "../../../database/models/user.model.js";
import { message } from "../../utils/confirmMessage.js";
import { sendEmail } from "../../services/sendingMails.js";
import { generateToken, verifyToken } from "../../utils/token.js";
import { nanoid } from "nanoid";
import { AppError } from "../../utils/AppErorr.js";
import { ApiFeatures } from "../../utils/apiFeatures.js";
import { getTotalPages } from "../../utils/paginationFunction.js";
import { systemRoles } from "../../utils/systemRoles.js";

//TODO Google sign
//signUp
export const signUp = errorHandler(async (req, res, next) => {
  // Extract password, confirmPassword, and other user data from the request body
  const { password, rePassword, email } = req.body;
  // Hash the password using the specified salt rounds
  const hashedPassword = bcrypt.hashSync(password, +process.env.SALT_ROUNDS);
  // Check if the passwords match
  if (password != rePassword) {
    return next(new AppError("Passwords don't match.", 401));
  }
  const token = generateToken({
    payload: { email },
    signature: process.env.CONFIRMATION_TOKEN_SECRET_KEY,
    expiresIn: { expiresIn: "48h" },
  });
  // Send an email to the user with the confirmation token
  const confirmationLink = `${req.protocol}://${req.headers.host}/users/confirmEmail/${token}`;
  const confirmationMessage = message(confirmationLink, "email");
  // Create a new user with the provided user data and hashed password
  const user = await userModel.create({
    ...req.body,
    password: hashedPassword,
  });

  if (user) {
    await sendEmail({
      to: email,
      subject: "Confirmation Email",
      html: confirmationMessage,
    });
  }
  return res.status(201).json({ message: "Done" });
});

//confirm email
export const confirmEmail = errorHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = verifyToken({
    token,
    signature: process.env.CONFIRMATION_EMAIL_TOKEN,
  });

  const isConfirmedCheck = await userModel.findOne({ email: decoded.email });
  if (isConfirmedCheck.isConfirmed) {
    return next(new ErrorApp("Your email is already confirmed", 400));
  }
  const user = await userModel.findOneAndUpdate(
    { email: decoded.email, isConfirmed: false },
    { isConfirmed: true },
    {
      new: true,
    }
  );
  if (!user)
    return res
      .status(200)
      .json({ message: "Confirmed Done please try to login", user });
});

//signIn
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });
  if (user && bcrypt.compareSync(password, user.password)) {
    if(user.status=="Blocked"){
      return next(new AppError("Your account has been blocked. Please contact with admin.", 402));
    }
    const token = generateToken({
      payload: { _id: user._id, role: user.role },
      signature: process.env.TOKEN_SECRET_KEY,
      expiresIn: { expiresIn: "240h" },
    });
    user.status = "Online";
    await user.save();
    res.status(200).json({ message: "Done.", token: token });
  } else {
    // Return an error response if user not found or password is incorrect
    return next(new AppError("User not found or password is incorrect.", 402));
  }
};

//forgetPassword
export const forgetPassword = errorHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new AppError("Email is not correct.", 401));
  }
  const code = nanoid();
  const hashedCode = bcrypt.hashSync(code, +process.env.SALT_ROUNDS);

  const token = generateToken({
    payload: {
      email,
      forgetCode: hashedCode,
    },
    signature: process.env.RESET_TOKEN,
    expiresIn: { expiresIn: "1h" },
  });
  // TODO add front end link
  const resetPasswordLink = `http://localhost:5173/reset-password?token=${token}`;
  const confirmationMessage = message(resetPasswordLink, "reset");
  const isEmailSent = sendEmail({
    to: email,
    subject: "Reset Password",
    html: confirmationMessage,
  });
  if (!isEmailSent) {
    return next(new Error("fail to sent reset password email", { cause: 400 }));
  }
  await userModel.findOneAndUpdate(
    { email },
    {
      forgetCode: hashedCode,
    }
  );
  res.status(200).json({ message: "Done", resetPasswordLink });
});

//resetPassword
export const resetPassword = errorHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = verifyToken({ token, signature: process.env.RESET_TOKEN });
  const user = await userModel.findOne({
    eamil: decoded.eamil,
    forgetCode: decoded.forgetCode,
  });
  if (!user) {
    return next(
      new AppError(
        "you have already reset your password once before , try to login",
        400
      )
    );
  }

  const { newPassword, rePassword } = req.body;
  if (newPassword !== rePassword) {
    return next(new AppError("Passwords don't match.", 401));
  }
  const hashedPassword = bcrypt.hashSync(newPassword, +process.env.SALT_ROUNDS);

  user.password = hashedPassword;
  user.forgetCode = null;
  user.passwordChangedAt = Date.now();
  const resetedPassData = await user.save();
  res.status(200).json({ message: "Done", resetedPassData });
});

// change password(user must be logged in)
export const changePassword = errorHandler(async (req, res, next) => {
  const { oldPassword, newPassword, rePassword } = req.body;
  if (!Object.keys(req.body).length) {
    return res.status(400).json({
      message: "Please send data that shloud be updated.",
      status: false,
    });
  }
  const { _id, password } = req.user;

  // Check if the old password matches the user's stored password
  if (!bcrypt.compareSync(oldPassword, password)) {
    return next(new AppError("Old password is wrong.", 401));
  } else if (newPassword !== rePassword) {
    // Check if the new password and confirm password match
    return next(new AppError("Passwords don't match.", 401));
  } else {
    // Hash the new password and update the user's password
    const hashedPassword = bcrypt.hashSync(
      newPassword,
      +process.env.SALT_ROUNDS
    );
    await userModel.findByIdAndUpdate(_id, {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    });
    // Return success message
    return res.status(201).json({ message: "Done" });
  }
});

// update
export const updateUser = errorHandler(async (req, res, next) => {
  const { _id } = req.user;
  const user = await userModel.findById(_id);
  if (req.body.email) {
    if (user.email === req.body.email) {
      return next(
        new AppError("please enter different email from the old email.", 401)
      );
    }
    if (await userModel.findOne({ email: req.body.email })) {
      return next(new AppError("email is already exist.", 400));
    }
  }
  const updatedUser = await userModel.findByIdAndUpdate(
    _id,
    {
      ...req.body,
    },
    { new: true }
  );
  return res.status(200).json({ message: "Done" });
});

// delete
export const deleteUser = errorHandler(async (req, res, next) => {
  const user = await userModel.findByIdAndDelete(req.user._id);
  return res.status(200).json({ message: "Done" });
});

//logout
export const logOut = errorHandler(async (req, res, next) => {
  const user = await userModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      status: "Offline",
    }
  );
  return res.status(200).json({ message: "Done" });
});

//getUser
export const getUser = errorHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  if (!user) {
    return next(new AppError("User is  not exist.", 404));
  }
  return res.status(200).json({ message: "Done", user });
});
//getAllUsers
export const getAllUsers = errorHandler(async (req, res, next) => {
  const { search, size } = req.query;
  const apiFeaturesInstance = new ApiFeatures(
    userModel.find({
$or: [
        {name: { $regex: search ? search : ".", $options: "i" }},
      {"deliveryDetails.phone": { $regex: search ? search : ".", $options: "i" }},
      {email: { $regex: search ? search : ".", $options: "i" }},
]
    }).select("name email deliveryDetails status role"),
    req.query
  )
    .pagination()
    .sort()

  const users = await apiFeaturesInstance.mongooseQuery;
  const totalCount = await userModel.countDocuments({
    ...apiFeaturesInstance.mongooseQuery._conditions,
  });
  res.status(200).json({
    message: "Done",
    page: req.query.page,
    totalPages: getTotalPages(totalCount, size),
    users,
  });
  ;
});

export const toggleBlock=errorHandler(async (req, res, next) => {
  const { userId, status } = req.body;
   await userModel.findByIdAndUpdate(userId,{
    status,
  });
  return res.status(201).json({ message: "Done" });
})

export const changeUserRole= errorHandler(async (req,res,next)=>{
  const {role,userId}=req.body
  if(req.user.role!==systemRoles.SUPER_ADMIN){
    return next(new AppError("you are not authorized to perform this action",401))
  };

  await userModel.findByIdAndUpdate(userId,{
    role
  })
  return res.status(201).json({message:"Done"})
}) 
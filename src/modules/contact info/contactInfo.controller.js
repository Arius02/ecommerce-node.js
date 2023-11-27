import { userModel } from "../../../database/models/user.model.js";
import errorHandler from "../../utils/errorHandler.js";

// adress and phoneNumbers
export const addUserContactInfo = (async (req, res, next) => {
    const { _id } = req.user;

    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset isSelected 
    user.deliveryDetails.forEach((element) => {
      element.isSelected = false;
    });

    // Add new contact info and set isSelected to true
    user.deliveryDetails.push({ ...req.body, isSelected: true });

    // Save the updated user
    await user.save();

    return res.status(201).json({ message: "Done" });

});


// export const updateUserContactInfo = errorHandler(async(req,res,next)=>{
//   const {id}= req.body
//   const {_id}= req.user
//   await userModel.findOneAndUpdate(_id,{

//   })
//   return res.status(201).json({message:"Done"})
// })

export const deleteUserContactInfo = errorHandler(async (req, res, next) => {
  const { id } = req.params;
  const { _id } = req.user;

  const user = await userModel.findByIdAndUpdate(
    _id,
    {
      $pull: { deliveryDetails: { _id: id } },
    },
    { new: true }
  );
  if (!user) {
    return next(new AppError("an error eccoured please try again.", 400));
  }
  return res.status(201).json({ message: "Done" });
});
export const setDeliveryAddress = errorHandler(async (req, res, next) => {
    const { id } = req.body;
    const { _id } = req.user;

    // Retrieve the user and select only the deliveryDetails
    const user = await userModel.findById(_id).select("deliveryDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update isSelected based on the provided id
    user.deliveryDetails.forEach((obj) => {
      obj.isSelected = obj._id.toString() === id.toString();
    });

    // Save the updated user with modified deliveryDetails
    await user.save();

    return res.status(201).json({ message: "Done" });

});

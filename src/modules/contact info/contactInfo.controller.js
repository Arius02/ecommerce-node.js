import { userModel } from "../../../database/models/user.model.js";
import { addInfo } from "../../utils/factory.js";
import errorHandler from "../../utils/errorHandler.js";

// adress and phoneNumbers 
export const addUserContactInfo = errorHandler(async(req,res,next)=>{
    const {address, phoneNumber}= req.body
    const {_id}= req.user
    if(address){
     return addInfo(_id, req.user.address, address, 'Addresses', 'address', userModel, next, res);
    }else{
     return  addInfo(_id, req.user.phoneNumbers, phoneNumber, 'Phone Numbers', 'phoneNumbers', userModel, next, res);
    }  
  })
  export const updateUserContactInfo = errorHandler(async(req,res,next)=>{
    const {address, id}= req.body
    const {_id}= req.user
    let user ;
    if(address){
       await userModel.findByIdAndUpdate(_id,{
        $pull:{address:{_id:id}},
      },{new:true})
      user = await userModel.findByIdAndUpdate(_id,{
        $push:{address:req.body.address}
      },{new:true})
    }else{
       //TODO updating phone numbers
    }  
    return res.status(201).json({message:"Done",user})
  })
  export const deleteUserContactInfo = errorHandler(async(req,res,next)=>{
    const {phoneNumber, id}= req.body
    const {_id}= req.user
    let user ;
    if(id){
       user= await userModel.findByIdAndUpdate(_id,{
        $pull:{address:{_id:id}},
      },{new:true})
    }else{
      user= await userModel.findByIdAndUpdate(_id,{
        $pull:{phoneNumbers:phoneNumber},
      },{new:true})  }  
    return res.status(201).json({message:"Done",user})
  })
  export const setDeliveryAddress=errorHandler(async(req,res,next)=>{
    const { id}= req.params
    const {_id}= req.user
    const addresses= await  userModel.findById(_id).select("address -_id")
    for (const obj of addresses.address) {
      if(obj.isSelected){
        obj.isSelected= false
      }else if(obj._id.toString()== id.toString()){
        obj.isSelected= true
      }
    }
    await userModel.findByIdAndUpdate(_id,{
      address:addresses.address
    })
    return res.status(201).json({message:"Done"})
  })
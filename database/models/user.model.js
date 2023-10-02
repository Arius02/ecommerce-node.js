import mongoose, { Schema, model } from 'mongoose'
import { systemRoles } from '../../src/utils/systemRoles.js'

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      default: systemRoles.USER,
      enum: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN, systemRoles.DELIVERY_MAN],
    },
    phoneNumbers: [String],
    address: [{city:String,
        town:String,
        street:String,
      isSelected:{
        type:Boolean,
        default:false
      } }],

    status: {
      type: String,
      default: 'Offline',
      enum: ['Online', 'Offline','Blooked'],
    },
    gender: {
      type: String,
      default: 'Not specified',
      enum: ['male', 'female', 'Not specified'],
    },
    age: Number,
    forgetCode: String,
    passwordChangedAt:Date,
    wishlist:[{type:mongoose.Types.ObjectId,ref:"product"}],
    provider:{
      type:String,
      enum:["system","google"],
      default:"system"
    }
  },
  { timestamps: true },
)


export const userModel = model('User', userSchema)

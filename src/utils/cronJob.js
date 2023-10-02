import { scheduleJob } from "node-schedule";
import {couponModel} from "../../database/models/coupon.model.js";
import moment from "moment-timezone";
import  fs  from 'fs'
import  path  from 'path'
export const changeCouponStatusCron = ()=>{
    scheduleJob("*0 0 * * *",async()=>{
        const validCoupons= await couponModel.find({status:"active"})
        for(const coupon of validCoupons){
            if(moment(coupon.toDate).isBefore(moment().tz("Africa/Cairo"))){
                coupon.status= "expired"
                await coupon.save()
            }
            
        }
    })
}

export const deleteFilesCron= ()=>{
    
    const filesDirectory = path.resolve(`./Files`) 
    scheduleJob("*0 0 * * *",async()=>{

      fs.readdir(filesDirectory, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return;
        }
    
        files.forEach((file) => {
            const filePath = path.join(filesDirectory, file);
    
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error('Error deleting file')}
            });
          
        });
      });

    })

}


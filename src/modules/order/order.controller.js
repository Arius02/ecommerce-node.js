import Stripe from "stripe";
import { cartModel } from "../../../database/models/cart.model.js";
import { couponModel } from "../../../database/models/coupon.model.js";
import { orderModel } from "../../../database/models/order.model.js";
import { productModel } from "../../../database/models/product.model.js";
import { AppError } from "../../utils/AppErorr.js";
import errorHandler from "../../utils/errorHandler.js"
import { paymentFunction } from "../../utils/paymentFunction.js";
import { applyCoupon } from "../coupon/coupon.controller.js";
import { createOrder, updateProductStock } from "../../utils/factory.js";
import createInvoice from "../../utils/pdfkit.js";
import { sendEmail } from "../../services/sendingMails.js";
import { nanoid } from "nanoid";

const sendOrderPdfToUser= async(name,email,address,order)=>{
   const orderCode = `${name}_${nanoid(3)}`
   const stringAddress= `${address.street}, ${address.town}, ${address.city}`
const coupon = await couponModel.findById(order.coupon)
const couponDiscount = coupon?coupon.couponType==="percentage"?`${coupon.discountValue}%`:`${coupon.discountValue}EGP`:"No Coupon"
      const orderinvoice = {
        orderCode,
        date: order.createdAt,
        shipping: {
          name: name,
          address: stringAddress,
          city: address.city,
          town: address.town,
          country: 'Egypt',
        },
        items: order.products,
        subTotal: order.totalPrice,
        paidAmount: order.priceAfterDiscount?order.priceAfterDiscount:order.totalPrice,
        couponDiscount,
      }
       createInvoice(orderinvoice, `${orderCode}.pdf`)
      const isEmailSent = await sendEmail({
        to: email,
        subject: 'Order Confirmation',
        html: `<h1>please find your invoice attachment below</h1>`,
        attachments: [
          {
            path: `./Files/${orderCode}.pdf`,
          },
        ],
      })

};


export const createCashOrder = errorHandler(async (req, res, next) => {
  const { _id, address, phoneNumbers,name,email } = req.user;
  const { cartId } = req.params;

  const cart = await cartModel.findById(cartId);

  if (!cart || !cart.products.length) {
    return next(new AppError("Invalid cartId or empty cart", 404));
  }
  const selectedAddress= address.filter(elm => elm.isSelected == true)[0]
    const order = await createOrder(
      _id,
      cart.products,
      cart.totalPrice,
      cart.priceAfterDiscount,
      stringAddress,
      phoneNumbers,
      cart.coupon,
      "processing"
                );
    await order.save()
    await updateProductStock(cart.products);
    await cartModel.findByIdAndDelete(cartId);
    await sendOrderPdfToUser(name,email,selectedAddress,order)
    return res.status(201).json({ message: "Done", order });
 
});

export const checkoutSession =errorHandler( async (req, res, next) => {
  const { cartId } = req.params;
  const { _id, email, address, name, phoneNumbers } = req.user;

  const cart = await cartModel.findOne({ _id: cartId, userId: _id });

  if (!cart || !cart.products.length) {
    return next(new AppError("Invalid cartId or empty cart", 404));
  }

  const totalPrice = cart.priceAfterDiscount ? cart.priceAfterDiscount : cart.totalPrice;
  const selectedAddress= address.filter(elm => elm.isSelected == true)[0]
    const order = await createOrder(
      _id,
      cart.products,
      cart.totalPrice,
      cart.priceAfterDiscount,
      selectedAddress,
      phoneNumbers,
      cart.coupon,
      "waitPayment"
    );
await order.save()
    const session = await paymentFunction({
      customer_email: email,
      client_reference_id: _id,
      metadata: {
        orderId: order._id.toString(),
      },
      success_url: "https://facebook.com",
      cancel_url: "https://facebook.com",
      line_items: [
        {
          price_data: {
            currency: "egp",
            unit_amount: totalPrice * 100,
            product_data: {
              name: name,
            },
          },
          quantity: 1,
        },
      ],
    });
    
    if (session) {
      await updateProductStock(cart.products);
      await cartModel.findByIdAndDelete(cartId);
      return res.status(201).json({ message: "Done", url: session.url });
    }
    
});
  
export const createDirectCashOrder = errorHandler(async (req, res, next) => {
    const { _id, address, phoneNumbers, email, name } = req.user;
    const { productId, quantity, couponCode } = req.body;

    const product = await productModel.findOne({
      _id: productId,
      stock: { $gte: quantity },
    }).select("name priceAfterDiscount price appliedDiscount  -_id");
    if (!product) {
      return next(new AppError('Invalid product or insufficient quantity', 400));
    }
    const selectedAddress= address.filter(elm => elm.isSelected == true)[0]
    const order = await createOrder(
      _id,
      [{ productId, quantity, ...product }],
      product.priceAfterDiscount * quantity,
      product.priceAfterDiscount * quantity,
      selectedAddress,
      phoneNumbers,
      null,  // No coupon for direct orders
      "processing"
    );
    if (couponCode) {
      const couponResult = await applyCoupon(req, res, next, order, "Order");
      if (couponResult !== true) {
        return next(new AppError(couponResult.message, couponResult.cause));
      }
    }else{
     await order.save()
    }
    await updateProductStock(order.products);
      await sendOrderPdfToUser(name,email,selectedAddress,order)
      return res.status(201).json({ message: "Done", order });
    
 
});

export const createDirectOnlineOrder = errorHandler(async (req, res, next) => {
  const { _id, address, phoneNumbers, email, name } = req.user;
  const { productId, quantity, couponCode } = req.body;

    const product = await productModel.findOne({
      _id: productId,
      stock: { $gte: quantity },
    }).select("name priceAfterDiscount price appliedDiscount  -_id");

    if (!product) {
      return next(new AppError('Invalid product or insufficient quantity', 400));
    }
    const selectedAddress= address.filter(elm => elm.isSelected == true)[0]
    const order = await createOrder(
      _id,
      [{ productId, quantity, ...product }],
      product.priceAfterDiscount * quantity,
      product.priceAfterDiscount * quantity,
      selectedAddress,
      phoneNumbers,
      null,  // No coupon for direct orders
      "waitPayment"
    );

    if (couponCode) {
      const couponResult = await applyCoupon(req, res, next, order, "Order");
      if (couponResult !== true) {
        return next(new AppError(couponResult.message, couponResult.cause));
      }
    }else{
      await order.save()
     }

      const session = await paymentFunction({
        customer_email: email,
        client_reference_id: _id,
        metadata: {
          orderId: order._id.toString(),
        },
        success_url: "https://facebook.com",
        cancel_url: "https://facebook.com",
        line_items: [
          {
            price_data: {
              currency: "egp",
              unit_amount: product.priceAfterDiscount * 100,
              product_data: {
                name: name,
              },
            },
            quantity,
          },
        ],
      });
    
      if (session) {
        await updateProductStock(order.products);

        return res.status(201).json({ message: "Done", url: session.url, order });
      }
      
      return next(new AppError("an error eccured please try again. ", 400))
});

export const cancelOrder = errorHandler(async(req,res,next)=>{
  const {orderId}= req.params
  const {reason}= req.body
  const {_id}= req.user
  const order = await orderModel.findById(orderId)
  if(!order){
    return next(new AppError("invalid orderId",404))
  }
  if(order.userId.toString() !== _id.toString()){
    return next(new AppError("You have no access to cancel this order.",401))
  }
  if(order.status !== "processing" && order.status !== "waitPayment"){
    return next(new AppError("this order can't be canceled",400))
  }
  order.status= "canceled"
  order.canceledReason= reason

  await order.save()
  await updateProductStock(order.products,false)
  return res.status(201).json({message:"Done", order})
});

export const updateOrderStatus =errorHandler(async(req,res,next)=>{
  const {orderId}=req.params
  const {orderStatus, reason}= req.body
  const order = await orderModel.findById(orderId)
  if(!order){
    return next(new AppError("invalid orderId",404))
  } 
  order.status=orderStatus
  if(orderStatus== "canceled"){
    order.canceledReason= reason
  await updateProductStock(order.products,false)

  }
  if(order.PaymentMethod=="cash"&& orderStatus== "delivered" ){
    order.paidAt= new Date()
  }
  await order.save()
  return res.status(201).json({message:"Done",order})
});

export const getAllUserOrders =  errorHandler(async(req,res,next)=>{
  const orders = await orderModel.findOne({userId:req.user._id})
  return res.status(200).json({message:"Done",count:orders.length,orders})
});

export const getAllOrders = errorHandler(async(req,res,next)=>{
  const orders = await orderModel.find()
  return res.status(200).json({message:"Done",count:orders.length,orders})
});

// stripe webhook
export const createOnlineOrder= (async(request, response) => {
  const sig = request.headers['stripe-signature']
  const endpointSecret= process.env.ENDPOINT_SECRET
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  let event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    return response.status(400).send(`Webhook Error: ${err.message}`);
     
  }
  // Handle the event
  if(event.type==="checkout.session.completed"){
    const checkoutSessionCompleted = event.data.object;
     const order=await orderModel.findOneAndUpdate({_id:checkoutSessionCompleted.metadata.orderId,status:"waitPayment"},{
    status:"processing",
    paidAt:new Date()
    })
    const {name,email} = await userModel.findById(order.userId)
    await sendOrderPdfToUser(name,email,order.address,order)
    return response.json({ received: true });
    }
    await orderModel.findOneAndUpdate({_id:checkoutSessionCompleted.metadata.orderId,status:"waitPayment"},{
      status:"fail to pay",
      })
      return response.json({ received: false });
});


    




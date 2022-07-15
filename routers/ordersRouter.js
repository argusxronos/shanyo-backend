const {Order} = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();


// GET REQUESTS

// GET ALL ORDERS
router.get('/', async(req, res) => {
    const orderList = await Order.find()
    .populate('user', 'name')
    .sort({'dateOrdered': -1})

    if (!orderList) {
        res.status(500).json({success: false})
    }
    res.send(orderList);
})

//  GET AN ORDER BY ID
router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
    .populate('user', 'name')
    .populate({ 
        path: 'orderItems', 
        populate: { 
            path: 'product', 
            populate: 'category'
        }
    });

    if (!order) {
        return res.status(500).json({success: false, message: 'The Order cannot be found!'});
    }

    res.send(order);
})

// GET TOTAL SALES
router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' }}}
    ]);

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated!');
    }

    res.send({totalSales: totalSales.pop().totalSales});
})

// GET ORDERS COUNT
router.get('/get/count', async (req, res) => {
    const orderCount = await Order.countDocuments();

    if (!orderCount) {
        res.status(500).json({success: false, message: 'Orders count cannot be calculated!'});
    }
    res.send({orderCount: orderCount});
})

// GET USERS ORDER
router.get('/get/userorders/:userid', async (req, res) => {
    const userOrderList = await Order.find({user: req.params.userid})
    .populate({
        path: 'orderItems',
        populate: {
            path: 'product',
            populate: 'category'
        }
    }).sort({'dateOrdered': -1});

    if (!userOrderList) {
        res.status(500).json({success: false, message: 'User Orders cannot be listed!'});
    }

    res.send(userOrderList);
})

// POST REQUESTS
router.post('/', async (req, res) =>{
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }));

    const orderItemsIdsResoled = await orderItemsIds;
    const totalPrice = await calculateTotalPrice(orderItemsIdsResoled);

    let order = new Order({
        orderItems: orderItemsIdsResoled,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        country: req.body.country,
        city: req.body.city,
        zip: req.body.zip,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })

    order = await order.save();

    if (!order) {
        return res.status(400).json({success: false, message: 'The Order cannot be created!'})
    }
    res.send(order);
})

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )

    if (!order) {
        return res.status(400).json({success: false, message: 'The Order with Id cannot be found!'})
    }

    res.send(order);
})

router.delete('/:id', (req, res) => {
    Order.findByIdAndDelete(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'The order was deleted!'})
        } else {
            return res.status(404).json({success: false, message: 'The order was not deleted!'})
        }
    }).catch(err => {
        return res.status(500).json({success: false, error: err })
    })
})

// ESPECIFIC FUNTIONS
async function calculateTotalPrice(orderItems){
    let totalPrices = await Promise.all(orderItems.map(async (orderItemId) => {
        const orderItem = await OrderItem.findById(orderItemId)
        .populate('product', 'price');
        const totalPrice = orderItem.product.price * orderItem.quantity;
        return totalPrice;
    }))

    totalPrices = totalPrices.reduce((a, b) => a + b, 0);
    return totalPrices;
}

module.exports = router;
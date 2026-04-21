const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const QueueService = require('../services/QueueService');
const SMSService = require('../services/SMSService');

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { customer_name, customer_phone, items, language } = req.body;

    // 1. Basic validation
    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Spam Prevention: Check if customer already has a pending order
    const existingOrder = await Order.findOne({
      where: {
        customer_phone,
        status: { [Op.in]: ['pending', 'ready'] }
      }
    });

    if (existingOrder) {
      return res.status(400).json({ 
        error: language === 'rw' 
          ? 'Ufite indi commande itaruzura. Tegereza uyifate mbere yo gukora indi.' 
          : 'You already have an active order. Please pick it up before ordering again.' 
      });
    }

    let total_price = 0;
    const orderItemsToCreate = [];

    // 2. Validate products and stock
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      if (item.quantity > product.max_per_customer) {
        throw new Error(`Quantity exceeds limit for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      total_price += itemTotal;

      orderItemsToCreate.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_time: product.price
      });

      // Decrement stock
      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });
    }

    // 3. Assign Queue and Slot
    const { queue_number, pickup_time } = await QueueService.assignQueueAndSlot();

    // 4. Create Order
    const order = await Order.create({
      customer_name,
      customer_phone,
      total_price,
      queue_number,
      pickup_time,
      status: 'pending'
    }, { transaction: t });

    // 5. Create Order Items
    for (const itemData of orderItemsToCreate) {
      await OrderItem.create({
        ...itemData,
        order_id: order.id
      }, { transaction: t });
    }

    await t.commit();

    // 6. Send SMS Notification (Async)
    SMSService.sendSMS(customer_phone, language || 'en', 'confirmation', {
      name: customer_name,
      id: order.id,
      queue: queue_number,
      time: pickup_time.toLocaleTimeString(),
      total: total_price
    });

    res.status(201).json(order);
  } catch (error) {
    await t.rollback();
    res.status(400).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await Order.findByPk(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
  
      order.status = status;
      await order.save();
      
      // If status is missed, send SMS
      if (status === 'missed') {
          SMSService.sendSMS(order.customer_phone, 'en', 'missed', {
              name: order.customer_name,
              id: order.id
          });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Restore stock when deleting an order
    const orderItems = await OrderItem.findAll({ where: { order_id: id } });
    for (const item of orderItems) {
      const product = await Product.findByPk(item.product_id);
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save();
      }
    }

    await order.destroy();
    res.json({ message: 'Order removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

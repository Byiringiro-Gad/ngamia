const { Order, OrderItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize');
const QueueService = require('../services/QueueService');
const SMSService = require('../services/SMSService');

const ACTIVE_ORDER_STATUSES = ['pending', 'ready'];
const ORDER_INCLUDE = [{ model: OrderItem, include: [Product] }];

const normalizeCustomerName = (value = '') => String(value).trim().replace(/\s+/g, ' ');
const normalizeCustomerPhone = (value = '') => String(value).trim().replace(/\s+/g, '');

const getDuplicateOrderMessage = (language) => {
  if (language === 'rw') {
    return 'Mufite commande iri gukora kuri iri zina n’iyi nimero. Mushobora kuyireba no kuyihindura aho kohereza indi.';
  }

  if (language === 'fr') {
    return 'Une commande active existe deja pour ce nom et ce numero. Ouvrez-la pour la consulter ou la modifier.';
  }

  return 'An active order already exists for this name and phone number. Open it to review or edit it instead of sending another one.';
};

const buildActiveOrderWhere = ({ customer_name, customer_phone }) => {
  const where = {
    status: { [Op.in]: ACTIVE_ORDER_STATUSES },
  };
  if (customer_phone) where.customer_phone = customer_phone;
  if (customer_name) where.customer_name = { [Op.like]: customer_name.trim() };
  return where;
};

const findActiveOrder = ({ customer_name, customer_phone }) => (
  Order.findOne({
    where: buildActiveOrderWhere({ customer_name, customer_phone }),
    include: ORDER_INCLUDE,
    order: [['createdAt', 'DESC']],
  })
);

exports.createOrder = async (req, res) => {
  let t;

  try {
    const language = req.body.language || 'en';
    const customer_name = normalizeCustomerName(req.body.customer_name);
    const customer_phone = normalizeCustomerPhone(req.body.customer_phone);
    const items = req.body.items;

    const existingOrder = await findActiveOrder({ customer_name, customer_phone });
    if (existingOrder) {
      return res.status(409).json({
        error: getDuplicateOrderMessage(language),
        existingOrder,
      });
    }

    t = await sequelize.transaction();

    let total_price = 0;
    const orderItemsToCreate = [];

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

      total_price += product.price * item.quantity;
      orderItemsToCreate.push({
        product_id: product.id,
        quantity: item.quantity,
        price_at_time: product.price,
      });

      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });
    }

    const { queue_number, pickup_time } = await QueueService.assignQueueAndSlot();

    const order = await Order.create({
      customer_name,
      customer_phone,
      total_price,
      queue_number,
      pickup_time,
      status: 'pending',
    }, { transaction: t });

    for (const itemData of orderItemsToCreate) {
      await OrderItem.create({
        ...itemData,
        order_id: order.id,
      }, { transaction: t });
    }

    await t.commit();

    try {
      SMSService.sendSMS(customer_phone, language, 'confirmation', {
        name: customer_name,
        id: order.id,
        queue: queue_number,
        time: pickup_time.toLocaleTimeString(),
        total: total_price,
      });
    } catch (_) {
      // SMS failure must not affect order creation.
    }

    res.status(201).json(order);
  } catch (error) {
    if (t) {
      await t.rollback();
    }

    res.status(400).json({ error: error.message });
  }
};

exports.getOrderByPhone = async (req, res) => {
  try {
    const customer_phone = normalizeCustomerPhone(req.params.phone);
    const customer_name = normalizeCustomerName(req.query.name);

    const order = await findActiveOrder({ customer_name, customer_phone });
    if (!order) {
      return res.json(null);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderItems = async (req, res) => {
  let t;

  try {
    const { id } = req.params;
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'Add at least one item to keep this order active' });
    }

    const order = await Order.findByPk(id, {
      include: ORDER_INCLUDE,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot edit a non-pending order' });
    }

    t = await sequelize.transaction();

    for (const item of order.OrderItems) {
      const product = await Product.findByPk(item.product_id);
      if (product) {
        product.stock_quantity += item.quantity;
        await product.save({ transaction: t });
      }
    }

    await OrderItem.destroy({ where: { order_id: id }, transaction: t });

    let total_price = 0;

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      if (item.quantity > product.max_per_customer) {
        throw new Error(`Quantity exceeds limit for ${product.name}`);
      }

      total_price += product.price * item.quantity;

      await OrderItem.create({
        order_id: id,
        product_id: product.id,
        quantity: item.quantity,
        price_at_time: product.price,
      }, { transaction: t });

      product.stock_quantity -= item.quantity;
      await product.save({ transaction: t });
    }

    await order.update({ total_price }, { transaction: t });
    await t.commit();

    const updated = await Order.findByPk(id, { include: ORDER_INCLUDE });
    res.json(updated);
  } catch (error) {
    if (t) {
      await t.rollback();
    }

    res.status(400).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: ORDER_INCLUDE,
      order: [['createdAt', 'DESC']],
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    await order.save();

    if (status === 'missed') {
      SMSService.sendSMS(order.customer_phone, 'en', 'missed', {
        name: order.customer_name,
        id: order.id,
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

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

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

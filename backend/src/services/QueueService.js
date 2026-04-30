const { Order, TimeSlot, sequelize } = require('../models');
const { Op } = require('sequelize');

class QueueService {
  /**
   * Assigns a queue number and pickup slot atomically.
   * Pass the outer transaction so the queue number is locked within the same
   * DB transaction as the order row — prevents two concurrent orders from
   * receiving the same queue number.
   */
  static async assignQueueAndSlot(transaction) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Lock the latest order row for this day so concurrent requests queue up
    const lastOrder = await Order.findOne({
      where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
      order: [['queue_number', 'DESC']],
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction,
    });

    const nextQueueNumber = lastOrder ? lastOrder.queue_number + 1 : 1;

    // Find an available future slot with space
    const futureSlots = await TimeSlot.findAll({
      where: { start_time: { [Op.gt]: new Date() } },
      order: [['start_time', 'ASC']],
      transaction,
    });

    let slot = futureSlots.find(s => s.current_usage < s.capacity) || null;

    // No slot available — create one 30 mins from now
    if (!slot) {
      const newStartTime = new Date(Date.now() + 30 * 60 * 1000);
      const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000);

      slot = await TimeSlot.create({
        start_time: newStartTime,
        end_time: newEndTime,
        capacity: 20,
        current_usage: 0,
      }, { transaction });
    }

    slot.current_usage += 1;
    await slot.save({ transaction });

    return {
      queue_number: nextQueueNumber,
      pickup_time: slot.start_time,
    };
  }
}

module.exports = QueueService;

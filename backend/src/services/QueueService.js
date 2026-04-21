const { Order, TimeSlot } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

class QueueService {
  /**
   * Assigns a queue number and pickup time for a new order.
   */
  static async assignQueueAndSlot() {
    // 1. Get the latest queue number for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const lastOrder = await Order.findOne({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      order: [['queue_number', 'DESC']]
    });

    const nextQueueNumber = lastOrder ? lastOrder.queue_number + 1 : 1;

    // 2. Find an available time slot
    let slot = await TimeSlot.findOne({
      where: {
        start_time: { [Op.gt]: new Date() },
        current_usage: { [Op.lt]: sequelize.col('capacity') }
      },
      order: [['start_time', 'ASC']]
    });

    // Fallback: If no future slot exists or all are full, create a new one (Simplified logic)
    if (!slot) {
      const lastSlot = await TimeSlot.findOne({ order: [['start_time', 'DESC']] });
      const newStartTime = lastSlot ? new Date(lastSlot.end_time.getTime() + 1) : new Date();
      if (newStartTime < new Date()) newStartTime.setTime(new Date().getTime() + 30 * 60 * 1000); // 30 mins from now
      
      const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000); // 1 hour slots

      slot = await TimeSlot.create({
        start_time: newStartTime,
        end_time: newEndTime,
        capacity: 20,
        current_usage: 0
      });
    }

    // Increment slot usage
    slot.current_usage += 1;
    await slot.save();

    return {
      queue_number: nextQueueNumber,
      pickup_time: slot.start_time
    };
  }
}

module.exports = QueueService;

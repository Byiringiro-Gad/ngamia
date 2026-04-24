const { Order, TimeSlot } = require('../models');
const { Op } = require('sequelize');

class QueueService {
  static async assignQueueAndSlot() {
    // 1. Get next queue number for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const lastOrder = await Order.findOne({
      where: { createdAt: { [Op.between]: [startOfDay, endOfDay] } },
      order: [['queue_number', 'DESC']]
    });

    const nextQueueNumber = lastOrder ? lastOrder.queue_number + 1 : 1;

    // 2. Find an available future slot with space
    // Fetch future slots and filter in JS to avoid dialect-specific SQL
    const futureSlots = await TimeSlot.findAll({
      where: { start_time: { [Op.gt]: new Date() } },
      order: [['start_time', 'ASC']]
    });

    let slot = futureSlots.find(s => s.current_usage < s.capacity) || null;

    // 3. No slot available — create one 30 mins from now
    if (!slot) {
      const newStartTime = new Date(Date.now() + 30 * 60 * 1000);
      const newEndTime = new Date(newStartTime.getTime() + 60 * 60 * 1000);

      slot = await TimeSlot.create({
        start_time: newStartTime,
        end_time: newEndTime,
        capacity: 20,
        current_usage: 0
      });
    }

    // 4. Increment slot usage
    slot.current_usage += 1;
    await slot.save();

    return {
      queue_number: nextQueueNumber,
      pickup_time: slot.start_time
    };
  }
}

module.exports = QueueService;

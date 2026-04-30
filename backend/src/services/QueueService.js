const { Order } = require('../models');

class QueueService {
  /**
   * Assigns the next queue number atomically within the given transaction.
   * Queue numbers are global (never reset) so they always increment.
   *
   * pickup_time is set to NOW — it represents when the order was placed,
   * not a predicted future slot. This is accurate and avoids stale slot data.
   */
  static async assignQueueAndSlot(transaction) {
    // Lock the highest-numbered order row so concurrent requests serialize here
    const lastOrder = await Order.findOne({
      order: [['queue_number', 'DESC']],
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      transaction,
    });

    const nextQueueNumber = lastOrder ? lastOrder.queue_number + 1 : 1;

    return {
      queue_number: nextQueueNumber,
      pickup_time: new Date(), // time the order was placed
    };
  }
}

module.exports = QueueService;

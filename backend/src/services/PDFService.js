const PDFDocument = require('pdfkit');
const { Order, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');

class PDFService {
  static async generateDailyManifest(res) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.findAll({
      where: {
        createdAt: { [Op.between]: [startOfDay, endOfDay] }
      },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['queue_number', 'ASC']]
    });

    const doc = new PDFDocument({ margin: 30 });

    // Stream the PDF directly to the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Ngamia - Daily Order Manifest', { align: 'center' });
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Table Header
    const tableTop = 150;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Queue', 30, tableTop);
    doc.text('Customer', 80, tableTop);
    doc.text('Phone', 200, tableTop);
    doc.text('Items', 300, tableTop);
    doc.text('Pickup', 500, tableTop);
    
    doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).stroke();

    // Table Body
    let y = tableTop + 25;
    doc.font('Helvetica');

    orders.forEach(order => {
      // Check if we need a new page
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const itemsSummary = order.OrderItems.map(i => `${i.quantity}x ${i.Product.name}`).join(', ');
      const pickup = new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      doc.text(`#${order.queue_number}`, 30, y);
      doc.text(order.customer_name, 80, y, { width: 110 });
      doc.text(order.customer_phone, 200, y);
      doc.text(itemsSummary, 300, y, { width: 190 });
      doc.text(pickup, 500, y);

      y += 30; // Row height
      doc.moveTo(30, y - 5).lineTo(570, y - 5).strokeColor('#eeeeee').stroke();
    });

    doc.end();
  }
}

module.exports = PDFService;

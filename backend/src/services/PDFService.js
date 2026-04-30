const PDFDocument = require('pdfkit');
const { Order, OrderItem, Product } = require('../models');

class PDFService {
  static async generateDailyManifest(res) {
    // Export ALL orders (no date filter) — sorted by queue number ascending
    const orders = await Order.findAll({
      include: [{ model: OrderItem, include: [Product] }],
      order: [['queue_number', 'ASC']]
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 80).fill('#c0392b');
    doc.fillColor('#ffffff')
      .fontSize(22).font('Helvetica-Bold')
      .text('NGAMIA', 40, 20);
    doc.fontSize(11).font('Helvetica')
      .text('Daily Order Manifest', 40, 46);
    doc.fontSize(11)
      .text(`Date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 60);

    // Summary box
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'picked_up').length;

    doc.fillColor('#1a1008').rect(40, 95, doc.page.width - 80, 50).fill('#fdf6ee');
    doc.fillColor('#1a1008').fontSize(9).font('Helvetica-Bold');
    doc.text(`TOTAL ORDERS: ${totalOrders}`, 55, 108);
    doc.text(`TOTAL REVENUE: ${totalRevenue.toLocaleString()} RWF`, 200, 108);
    doc.text(`PENDING: ${pendingOrders}`, 400, 108);
    doc.text(`COMPLETED: ${completedOrders}`, 480, 108);
    doc.fontSize(9).font('Helvetica').fillColor('#7a5c44')
      .text(`Generated: ${new Date().toLocaleTimeString()}`, 55, 124);

    // ── Table header ──
    let y = 160;
    const cols = { queue: 40, customer: 90, phone: 200, items: 300, pickup: 460, total: 510 };

    doc.rect(40, y, doc.page.width - 80, 20).fill('#c0392b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('#', cols.queue, y + 6);
    doc.text('CUSTOMER', cols.customer, y + 6);
    doc.text('PHONE', cols.phone, y + 6);
    doc.text('ITEMS (QTY × UNIT PRICE)', cols.items, y + 6);
    doc.text('ORDER TIME', cols.pickup, y + 6);
    doc.text('TOTAL', cols.total, y + 6);

    y += 22;

    // ── Table rows ──
    orders.forEach((order, idx) => {
      // Build items string with description and unit price
      const itemLines = order.OrderItems.map(item => {
        const desc = item.Product.description ? ` — ${item.Product.description}` : '';
        return `${item.quantity}× ${item.Product.name}${desc} @ ${parseFloat(item.price_at_time).toLocaleString()} RWF`;
      });
      const itemsText = itemLines.join('\n');

      // Estimate row height based on number of item lines
      const rowHeight = Math.max(30, itemLines.length * 14 + 10);

      // New page if needed
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = 40;
        // Repeat header on new page
        doc.rect(40, y, doc.page.width - 80, 20).fill('#c0392b');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('#', cols.queue, y + 6);
        doc.text('CUSTOMER', cols.customer, y + 6);
        doc.text('PHONE', cols.phone, y + 6);
        doc.text('ITEMS (QTY × UNIT PRICE)', cols.items, y + 6);
        doc.text('ORDER TIME', cols.pickup, y + 6);
        doc.text('TOTAL', cols.total, y + 6);
        y += 22;
      }

      // Row background alternating
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#fdf6ee';
      doc.rect(40, y, doc.page.width - 80, rowHeight).fill(rowBg);

      // Status indicator stripe
      const statusColor = order.status === 'picked_up' ? '#27ae60'
        : order.status === 'missed' ? '#e74c3c' : '#e67e22';
      doc.rect(40, y, 4, rowHeight).fill(statusColor);

      doc.fillColor('#1a1008').fontSize(9).font('Helvetica-Bold');
      doc.text(`#${order.queue_number}`, cols.queue + 6, y + 8);

      doc.font('Helvetica').fontSize(9);
      doc.text(order.customer_name, cols.customer, y + 8, { width: 100 });
      doc.text(order.customer_phone, cols.phone, y + 8, { width: 95 });
      doc.text(itemsText, cols.items, y + 8, { width: 155 });
      doc.text(
        new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cols.pickup, y + 8, { width: 45 }
      );
      doc.font('Helvetica-Bold').fillColor('#c0392b');
      doc.text(`${parseFloat(order.total_price).toLocaleString()} RWF`, cols.total, y + 8, { width: 55 });

      // Row border
      doc.moveTo(40, y + rowHeight).lineTo(doc.page.width - 40, y + rowHeight)
        .strokeColor('#f0dfc8').lineWidth(0.5).stroke();

      y += rowHeight;
    });

    // ── Footer ──
    doc.moveTo(40, y + 10).lineTo(doc.page.width - 40, y + 10)
      .strokeColor('#c0392b').lineWidth(1).stroke();
    doc.fillColor('#7a5c44').fontSize(8).font('Helvetica')
      .text(`Ngamia Order Management System  •  Total Revenue: ${totalRevenue.toLocaleString()} RWF  •  ${new Date().toLocaleDateString()}`,
        40, y + 16, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  }
}

module.exports = PDFService;

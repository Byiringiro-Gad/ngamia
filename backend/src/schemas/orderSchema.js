const { z } = require('zod');

// Rwandan phone: exactly 10 digits, starts with 07
// Valid prefixes: 072 (Airtel), 073 (Airtel), 078 (MTN), 079 (MTN)
const rwandaPhone = z.string()
  .trim()
  .regex(/^07[2389]\d{7}$/, 'Phone must be a valid Rwandan number (e.g. 0781234567)');

const orderSchema = z.object({
  body: z.object({
    customer_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    customer_phone: rwandaPhone,
    items: z.array(z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive().max(10, 'Maximum 10 items per product'),
    })).min(1, 'At least one item is required'),
    language: z.enum(['en', 'fr', 'rw']).optional().default('en'),
  }),
});

const updateOrderItemsSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive().max(10, 'Maximum 10 items per product'),
    })).min(1, 'At least one item is required'),
  }),
});

module.exports = { orderSchema, updateOrderItemsSchema };

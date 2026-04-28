const { z } = require('zod');

const orderSchema = z.object({
  body: z.object({
    customer_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    customer_phone: z.string().trim().regex(/^[0-9+]{10,15}$/, 'Invalid phone number format'),
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

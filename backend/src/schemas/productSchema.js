const { z } = require('zod');

const productSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
    description: z.string().trim().optional(),
    price: z.union([z.number(), z.string()]).transform((val) => parseFloat(val)),
    stock_quantity: z.union([z.number(), z.string()]).transform((val) => parseInt(val)),
    max_per_customer: z.union([z.number(), z.string()]).transform((val) => parseInt(val)).default(5),
    image_url: z.string().optional(),
  }),
});

module.exports = { productSchema };

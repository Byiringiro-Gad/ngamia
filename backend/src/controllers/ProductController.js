const { Product } = require('../models');
const { Op } = require('sequelize');
const StorageService = require('../services/StorageService');

// Customers — only products with stock > 0
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { stock_quantity: { [Op.gt]: 0 } },
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin — all products regardless of stock
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.findAll({ order: [['createdAt', 'DESC']] });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    if (req.file) {
      productData.image_url = await StorageService.uploadImage(req.file);
    }

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const productData = { ...req.body };

    if (req.file) {
      // Delete old image if it exists
      if (product.image_url) {
        await StorageService.deleteImage(product.image_url);
      }
      productData.image_url = await StorageService.uploadImage(req.file);
    }

    await product.update(productData);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    if (product.image_url) {
      await StorageService.deleteImage(product.image_url);
    }

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

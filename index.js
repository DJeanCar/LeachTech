import express from 'express';
import moment from 'moment';

import knex from './src/db/index.js';
import { PRODUCT_OPERATIONS, DATE_FORMAT } from './src/constants.js';
import {
  getProductStockByProductId,
  getProductById,
  createProduct,
  addHistory,
  createProductStock,
  validateDateFormat,
  updateProductStock,
  validatePurchaseAmountForProduct,
} from './src/utils.js';

const app = express();

app.use(express.json());

app.post('/register-purchase', async (req, res) => {
  const {
    date, amount, productId, productName,
  } = req.body;
  if (!validateDateFormat(date)) {
    return res.status(400).send({ error: 'Invalid date format' });
  }
  if (!await validatePurchaseAmountForProduct(productId, date, amount)) {
    return res.status(400).send({ error: 'Max limit per month exceeded' });
  }

  try {
    let product = await getProductById(productId);
    if (!product) {
      product = await createProduct(productId, productName);
    }

    await addHistory(productId, amount, PRODUCT_OPERATIONS.IN, moment(date, DATE_FORMAT));

    const productStock = await getProductStockByProductId(productId);
    if (!productStock) {
      await createProductStock(productId, amount);
    } else {
      const newStock = productStock.amount + parseInt(amount, 10);
      await updateProductStock(productId, newStock);
    }

    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    return res.send({ success: false, error: 'Could not register purchase' });
  }
});

app.post('/register-sale', async (req, res) => {
  const {
    date, amount, productId,
  } = req.body;

  if (!validateDateFormat(date)) {
    return res.status(500).json({ error: 'Invalid date format' });
  }

  const intAmount = parseInt(amount, 10);

  try {
    const product = await getProductById(productId);
    if (!product) {
      return res.status(500).json({ error: `Product ${productId} not found` });
    }

    const productStock = await getProductStockByProductId(productId);
    if (productStock.amount < intAmount) {
      return res.json({ error: `Not enough stock for product ${productId}` });
    }

    await addHistory(productId, amount, PRODUCT_OPERATIONS.OUT, moment(date, DATE_FORMAT));

    const newStock = productStock.amount - intAmount;
    await updateProductStock(productId, newStock);

    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    return res.send({ success: false, error: 'Could not register purchase' });
  }
});

app.listen(3000, () => {
  console.log('Server running at 3000');
});

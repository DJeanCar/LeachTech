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
    return res.status(400).send({ error: 'Max limit exceeded' });
  }

  const trx = await knex.transaction();

  try {
    let product = await getProductById(productId, trx);
    if (!product) {
      product = await createProduct(productId, productName, trx);
    }

    await addHistory(productId, amount, PRODUCT_OPERATIONS.IN, moment(date, DATE_FORMAT), trx);

    const productStock = await getProductStockByProductId(productId, trx);
    if (!productStock) {
      await createProductStock(productId, amount, trx);
    } else {
      const newStock = productStock.amount + parseInt(amount, 10);
      await updateProductStock(productId, newStock, trx);
    }

    await trx.commit();
    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    await trx.rollback();
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

  const trx = await knex.transaction();

  const intAmount = parseInt(amount, 10);

  try {
    const product = await getProductById(productId, trx);
    if (!product) {
      return res.status(500).json({ error: `Product ${productId} not found` });
    }

    const productStock = await getProductStockByProductId(productId, trx);
    if (productStock.amount < intAmount) {
      return res.json({ error: `Not enough stock for product ${productId}` });
    }

    await addHistory(productId, amount, PRODUCT_OPERATIONS.OUT, moment(date, DATE_FORMAT), trx);

    const newStock = productStock.amount - intAmount;
    await updateProductStock(productId, newStock, trx);

    await trx.commit();
    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    await trx.rollback();
    return res.send({ success: false, error: 'Could not register purchase' });
  }
});

app.listen(3000, () => {
  console.log('Server running at 3000');
});

import moment from 'moment';
import knex from './db/index.js';
import { PRODUCT_OPERATIONS, DATE_FORMAT } from './constants.js';

const MAX_AMOUNT_FOR_MONTH = 30;

export const isOperationAllowed = (operation) => Object
  .values(PRODUCT_OPERATIONS)
  .includes(operation);

export const getProductById = async (productId) => {
  const product = await knex('product').where('productId', productId);
  if (product.length === 0) {
    console.info(`Product ${productId} not found`);
    return null;
  }

  return product[0];
};

export const createProduct = async (productId, productName) => {
  if (!productId || !productName) {
    console.warn('Not enough info to create a product');
    return
  }
  console.info(`Creating product ${productId}`);

  await knex('product').insert({
    productId,
    name: productName,
  });
};

export const addHistory = async (productId, amount, operation, date) => {
  if (!isOperationAllowed(operation.toLowerCase())) {
    console.error(`Operation ${operation} not allowed. Please use in/out operations`);
    return;
  }

  await knex('history').insert({
    product: productId,
    date: date.toJSON(),
    amount,
    operation,
  });
};

export const getProductStockByProductId = async (productId) => {
  const stock = await knex('stock').where({
    product: productId,
  });
  if (stock.length === 0) {
    console.info(`Does not exist stock for product ${productId}`);
    return null;
  }

  return stock[0];
};

export const createProductStock = async (productId, amount) => {
  console.info(`Creating product stock ${productId}`);

  await knex('stock').insert({
    product: productId,
    amount,
  });
};

export const updateProductStock = async (productId, stock) => {
  console.info(`Update stock for product ${productId}`);
  await knex('stock').where('product', productId).update({
    amount: stock,
  });
};

export const validateDateFormat = (strDate, format = DATE_FORMAT) => {
  const date = moment(strDate, format, true);

  if (!date.isValid()) {
    console.error(`Invalid format date please use ${format}`);
    return false;
  }

  return true;
};

export const validatePurchaseAmountForProduct = async (productId, date, currentAmountPurchase) => {
  const startOfMonth = moment(date, DATE_FORMAT).startOf('month').toJSON();
  const endOfMonth   = moment(date, DATE_FORMAT).endOf('month').toJSON();
  const history = await knex('history')
    .whereBetween('date', [startOfMonth, endOfMonth])
    .andWhere('product', productId)
    .andWhere('operation', 'in')

  const amountFromHistory = history.reduce((acc, his) => {
    const { amount } = his;
    acc += amount;
    return acc
  }, 0);

  const totalAmountInMonth = amountFromHistory + currentAmountPurchase;
  if (totalAmountInMonth > MAX_AMOUNT_FOR_MONTH) {
    console.error('Max limit exceeded');
    return false;
  }

  return true;
}

export const calculateNewStock = (currentStock, amount, operation) => {
  if (operation === 'in') {
    return currentStock + amount;
  } else if (operation === 'out') {
    return currentStock - amount;
  }
}

import { jest } from '@jest/globals'
import db from '../db/index.js';
import {
  isOperationAllowed,
  getProductById,
  createProduct,
  addHistory,
  getProductStockByProductId,
  updateProductStock,
  calculateNewStock,
} from '../utils.js';

test('isOperationAllowed function should only allow in/out as valid operations', () => {
  expect(isOperationAllowed('xxxx')).toBe(false);
  expect(isOperationAllowed('in')).toBe(true);
  expect(isOperationAllowed('out')).toBe(true);
  expect(isOperationAllowed('osdadt')).toBe(false);
});

test('calculateNewStock function should return new stock based on the operation', () => {
  expect(calculateNewStock(10, 5, 'in')).toBe(15);
  expect(calculateNewStock(20, 5, 'in')).toBe(25);
  expect(calculateNewStock(10, 5, 'out')).toBe(5);
  expect(calculateNewStock(5, 5, 'out')).toBe(0);
});

beforeAll(async () => {
  await db.migrate.latest();
})



afterEach(() => {
  jest.useRealTimers();
});

describe('Products utils', () => {
  beforeEach(async () => {
    await db('product').delete();
    await db('history').delete();
    await db('stock').delete();
  });

  describe('Function getProductById', () => {
    test('should return null if product does not exist', async () => {
      const product = await getProductById('1');
  
      expect(product).toBe(null);
    });
  
    test('should return product object if product exist', async () => {
      await db('product').insert({
        productId: '1',
        name: 'Rice',
      });
      const product = await getProductById('1');

      expect(product).not.toBe(null);
      expect(product.productId).toBe('1');
    });
  });

  describe('Function createProduct', () => {
    test('should not create product if product does not have name or id', async () => {
      await createProduct('1');
      const product = await getProductById('1');

      expect(product).toBe(null);
    });

    test('should create product if it has name and id', async () => {
      await createProduct('2', 'Sugar');
      const product = await getProductById('2');

      expect(product).not.toBe(null);
      expect(product.productId).toBe('2');
    });
  });

  describe('Function addHistory', () => {
    test('should not add history if operation is not allowed', async () => {
      await addHistory('1', 2, 'invalid_operation', new Date());

      const history = await db('history').where('product', '1');
      expect(history.length).toBe(0);
    });

    test('should create history if operation is allowed', async () => {
      await addHistory('1', 2, 'in', new Date());
      const history = await db('history').where('product', '1');
      expect(history.length).toBe(1);
    });
  });

  describe('Function getProductStockByProductId', () => {
    test('should null if product does not exist', async () => {
      const stock = await getProductStockByProductId('1');
      expect(stock).toBe(null);
    });

    test('should return stock object if product exist', async () => {
      await createProduct('1', 'Sugar');
      await db('stock').insert({
        product: '1',
        amount: 5,
      });

      const stock = await getProductStockByProductId('1');
      expect(stock).not.toBe(null);
      expect(stock.product).toBe('1');
    });
  });

  describe('function updateProductStock', () => {
    test('should update product stock', async () => {
      await createProduct('1', 'Sugar');
      await db('stock').insert({
        product: '1',
        amount: 5,
      });

      await updateProductStock('1', 10);
      const stock = await getProductStockByProductId('1');
      expect(stock.amount).toBe(10)
    });
  });
});
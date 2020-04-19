import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const upload = multer(uploadConfig);
const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const transactions = await transactionsRepository
    .createQueryBuilder('transactions')
    .leftJoinAndSelect('transactions.category', 'category')
    .getMany();
  transactions.forEach(transaction => {
    delete transaction.category_id;
    delete transaction.created_at;
    delete transaction.updated_at;
    delete transaction.category.updated_at;
    delete transaction.category.created_at;
  });
  const balance = await transactionsRepository.getBalance();
  const answer = { transactions, balance };

  return response.json(answer);
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const createTransaction = new CreateTransactionService(
    transactionsRepository,
  );

  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryName: category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id: transactionId } = request.params;
  const deleteService = new DeleteTransactionService();
  const removedTransaction = await deleteService.execute(transactionId);
  return response.json(removedTransaction);
});

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const fileName = request.file.filename;
    const importTransactionsService = new ImportTransactionsService();
    const transactions = await importTransactionsService.execute(fileName);
    return response.json(transactions);
  },
);

export default transactionsRouter;

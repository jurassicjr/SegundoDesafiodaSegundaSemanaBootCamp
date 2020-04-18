import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<Transaction> {
    try {
      const transactionRepo = getCustomRepository(TransactionsRepository);
      const transactionToBeDeleted = await transactionRepo.findOne(id);
      if (!transactionToBeDeleted) {
        throw new AppError(
          'Can not delete a transaction with a invalid id',
          400,
        );
      }
      const removedTransaction = await transactionRepo.remove(
        transactionToBeDeleted,
      );
      return removedTransaction;
    } catch (error) {
      throw new AppError(
        'Could not delete the transaction, please try again later',
        400,
      );
    }
  }
}

export default DeleteTransactionService;

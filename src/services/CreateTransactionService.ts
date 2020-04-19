import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string;
}
class CreateTransactionService {
  private transactionsRepository: TransactionsRepository;

  constructor(transactionsRepository: TransactionsRepository) {
    this.transactionsRepository = transactionsRepository;
  }

  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('invalid transaction type', 400);
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (balance.total < value)
        throw new AppError('No balance to include new outcome.');
    }

    let foundedCategory = await categoryRepository.findOne({
      where: { title: categoryName },
    });

    if (!foundedCategory) {
      const category = categoryRepository.create({ title: categoryName });
      await categoryRepository.save(category);
      foundedCategory = category;
    }

    const transaction = this.transactionsRepository.create({
      title,
      value,
      type,
      category_id: foundedCategory.id,
    });

    await this.transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

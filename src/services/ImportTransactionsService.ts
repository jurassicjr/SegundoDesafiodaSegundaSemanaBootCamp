/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from 'fs';
import * as csv from 'fast-csv';
import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from './CreateTransactionService';

interface RowData {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  private async saveTransactions(data: RowData[]): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactions: Transaction[] = [];
    const createTransactionService = new CreateTransactionService(
      transactionsRepository,
    );

    for (let i = 0; i < data.length; i += 1) {
      const { title, type, value, category: categoryName } = data[i];

      const transaction = await createTransactionService.execute({
        title,
        type,
        value,
        categoryName,
      });
      transactions.push(transaction);
    }

    return transactions;
  }

  async execute(transactionFileName: string): Promise<Transaction[]> {
    const userAvatarFilePath = path.join(
      uploadConfig.directory,
      transactionFileName,
    );
    const data: RowData[] = [];

    const csvStream = fs
      .createReadStream(userAvatarFilePath)
      .pipe(csv.parse({ delimiter: ',', headers: true }))
      .on('data', async dataRow => data.push(dataRow));

    await new Promise(resolve => csvStream.on('end', resolve));

    const transactions = await this.saveTransactions(data);

    return transactions;
  }
}

export default ImportTransactionsService;

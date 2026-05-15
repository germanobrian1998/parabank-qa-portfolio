// src/factories/TransferFactory.ts
export interface TransferData {
  fromAccount: string;
  toAccount: string;
  amount: number;
}

export class TransferFactory {
  static valid(fromAccount: string, toAccount: string): TransferData {
    return { fromAccount, toAccount, amount: 100 };
  }

  static withAmount(
    fromAccount: string,
    toAccount: string,
    amount: number
  ): TransferData {
    return { fromAccount, toAccount, amount };
  }

  // Bug H-007: monto negativo — la factory lo documenta
  static withNegativeAmount(fromAccount: string, toAccount: string): TransferData {
    return { fromAccount, toAccount, amount: -50 };
  }
}
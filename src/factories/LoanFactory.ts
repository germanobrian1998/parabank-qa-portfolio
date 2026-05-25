// src/factories/LoanFactory.ts

export interface LoanRequest {
  amount: number;
  downPayment: number;
}

export class LoanFactory {
  /**
   * Base factory — solicitud de préstamo aprobable.
   * El servidor aprueba si downPayment >= amount * 0.1 y la cuenta tiene saldo suficiente.
   */
  static create(overrides?: Partial<LoanRequest>): LoanRequest {
    return {
      amount: 1000,
      downPayment: 100,
      ...overrides,
    };
  }

  /** Edge case: monto elevado — fuerza rechazo por riesgo crediticio */
  static withHighAmount(): LoanRequest {
    return {
      amount: 100_000,
      downPayment: 1000,
    };
  }

  /** Edge case: down payment cero */
  static withZeroDownPayment(): LoanRequest {
    return {
      amount: 1000,
      downPayment: 0,
    };
  }

  /** Edge case: monto negativo — debería rechazarse en validación */
  static withNegativeAmount(): LoanRequest {
    return {
      amount: -500,
      downPayment: 50,
    };
  }

  /** Edge case: down payment mayor al monto del préstamo */
  static withDownPaymentExceedingLoan(): LoanRequest {
    return {
      amount: 100,
      downPayment: 500,
    };
  }
}
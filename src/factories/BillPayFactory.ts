import { faker } from "@faker-js/faker";

export interface PayeeData {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  accountNumber: string;
}

export interface BillPayData {
  payee: PayeeData;
  amount: number;
  fromAccountId: string;
}

export interface BillPayResult {
  payeeName: string;
  amount: number;
  fromAccountId: string;
}

/**
 * BillPayFactory — genera datos de pago de facturas.
 *
 * Por qué accountNumber es string numérico de 10 dígitos:
 * Parabank valida que verifyAccount == accountNumber, ambos como strings.
 * Si los generamos como número puede haber pérdida de ceros a la izquierda.
 */
export class BillPayFactory {
  static createPayee(overrides: Partial<PayeeData> = {}): PayeeData {
    return {
      name: "Test Payee",
      street: "123 Main St",
      city: "Boston",
      state: "MA",
      zipCode: "02101",
      phone: "5550100",
      accountNumber: "12345",
      ...overrides,
    };
  }

  /*static createPayee(overrides: Partial<PayeeData> = {}): PayeeData {
    const accountNumber = faker.string.numeric(10);
    return {
      name: faker.company.name(),
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      phone: faker.string.numeric(10),
      accountNumber,
      ...overrides,
    };
  }*/

  static create(
    fromAccountId: string,
    overrides: Partial<BillPayData> = {},
  ): BillPayData {
    return {
      payee: BillPayFactory.createPayee(),
      amount: 50,
      fromAccountId,
      ...overrides,
    };
  }

  static withAmount(fromAccountId: string, amount: number): BillPayData {
    return BillPayFactory.create(fromAccountId, { amount });
  }

  static withZeroAmount(fromAccountId: string): BillPayData {
    return BillPayFactory.create(fromAccountId, { amount: 0 });
  }

  static withNegativeAmount(fromAccountId: string): BillPayData {
    return BillPayFactory.create(fromAccountId, { amount: -100 });
  }

  static withLargeAmount(fromAccountId: string): BillPayData {
    return BillPayFactory.create(fromAccountId, { amount: 999_999_999 });
  }
}

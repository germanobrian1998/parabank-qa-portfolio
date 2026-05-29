// src/factories/UserFactory.ts
import { faker } from '@faker-js/faker';

export interface CustomerData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
}

export class UserFactory {
  static create(overrides: Partial<CustomerData> = {}): CustomerData {
    const base: CustomerData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      phone: faker.string.numeric(10),
      ssn: faker.string.numeric(9),
      username: `u${Date.now()}${faker.string.numeric(6)}`,
      password: 'Test@' + faker.string.alphanumeric(8),
    };
    return { ...base, ...overrides };
  }

  static withSpecialCharacters(): CustomerData {
    return this.create({ firstName: "O'Brien", lastName: 'García-López' });
  }

  static withUsername(username: string): CustomerData {
    return this.create({ username });
  }
}
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
  // Por qué un método base + overrides:
  // Los tests necesitan datos válidos por defecto pero poder
  // sobreescribir campos específicos para probar edge cases.
  static create(overrides: Partial<CustomerData> = {}): CustomerData {
    const base: CustomerData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode('#####'),
      phone: faker.phone.number(),
      ssn: faker.string.numeric(9),
      username: faker.internet.username() + faker.string.numeric(4),
      password: 'Test@' + faker.string.alphanumeric(8),
    };
    return { ...base, ...overrides };
  }

  // Para tests de edge case: usuario con nombre que tiene caracteres especiales
  static withSpecialCharacters(): CustomerData {
    return this.create({ firstName: "O'Brien", lastName: 'García-López' });
  }
}
// src/api/client/ApiClient.ts
//
// Cliente HTTP para la API REST de Parabank.
//
// DECISIONES DE DISEÑO:
//
// 1. Session-based auth (no JWT): Parabank usa cookies de sesión JSESSIONID.
//    El cliente hace login una vez, almacena la cookie y la reenvía en cada
//    request subsiguiente. No hay token Bearer que gestionar.
//
// 2. Accept: application/json forzado: sin este header, varios endpoints
//    devuelven XML (comportamiento por defecto del servidor). Se setea
//    globalmente en cada request para evitar errores silenciosos de parsing.
//
// 3. fetch nativo (no axios): Playwright ya provee fetch vía request context.
//    Usar el APIRequestContext de Playwright permite que las cookies se
//    gestionen automáticamente por el mismo runtime que corre los tests.
//
// 4. URLs absolutas: el APIRequestContext de Playwright combina baseURL + path
//    de forma impredecible cuando el path ya incluye segmentos. Para evitar
//    problemas de resolución, se construyen URLs absolutas en cada request.
//
// 5. Errores tipados: cada método lanza ApiError con status + body para que
//    los tests puedan hacer assertions específicas sobre el error recibido.
//
// 6. Respuestas de texto plano: algunos endpoints devuelven texto plano en lugar
//    de JSON (ej: /transfer → "Successfully transferred..."). El post() intenta
//    parsear JSON y si falla retorna el texto como T para no romper el caller.

import { APIRequestContext, request } from '@playwright/test';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Account {
  id: number;
  customerId: number;
  type: 'CHECKING' | 'SAVINGS' | 'LOAN';
  balance: number;
}

export interface Transaction {
  id: number;
  accountId: number;
  type: string;
  date: number;
  amount: number;
  description: string;
}

export interface LoanResponse {
  loanProviderName: string;
  responseDate: string;
  approved: boolean;
  message?: string;
  accountId?: number;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly endpoint: string,
  ) {
    super(`[ApiClient] ${endpoint} → HTTP ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

export class ApiClient {
  private readonly baseUrl: string;
  private requestContext: APIRequestContext | null = null;

  constructor(baseUrl = 'http://localhost:9090/parabank') {
    this.baseUrl = baseUrl;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Crea el APIRequestContext de Playwright sin baseURL.
   * Las URLs se construyen absolutas en cada request para evitar
   * problemas de resolución de paths con segmentos múltiples.
   */
  async init(): Promise<void> {
    this.requestContext = await request.newContext({
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Libera el contexto. Llamar en afterAll/afterEach para evitar leaks.
   */
  async dispose(): Promise<void> {
    await this.requestContext?.dispose();
    this.requestContext = null;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  /**
   * Autentica al usuario y retorna el Customer con su id.
   * El customerId es necesario para llamar a /customers/{id}/accounts.
   * Verificado con curl: john/demo → { id: 12212, firstName: "John", ... }
   */
  async login(username: string, password: string): Promise<Customer> {
    return this.get<Customer>(`/services/bank/login/${username}/${password}`);
  }

  // ── Accounts ───────────────────────────────────────────────────────────────

  async getAccountsForCustomer(customerId: number): Promise<Account[]> {
    return this.get<Account[]>(`/services/bank/customers/${customerId}/accounts`);
  }

  async getAccount(accountId: number): Promise<Account> {
    return this.get<Account>(`/services/bank/accounts/${accountId}`);
  }

  // ── Transfers ──────────────────────────────────────────────────────────────

  /**
   * Ejecuta una transferencia entre cuentas.
   * Endpoint: POST /services/bank/transfer
   * Params: fromId, toId, amount (query params según la API de Parabank)
   * Nota: el servidor devuelve texto plano ("Successfully transferred..."), no JSON.
   */
  async transfer(fromId: number, toId: number, amount: number): Promise<void> {
    const params = new URLSearchParams({
      fromAccountId: String(fromId),
      toAccountId: String(toId),
      amount: String(amount),
    });
    await this.post(`/services/bank/transfer?${params.toString()}`);
  }

  // ── Loans ──────────────────────────────────────────────────────────────────

  /**
   * Solicita un préstamo.
   *
   * ADVERTENCIA — EFECTO LATERAL:
   * Este endpoint NO es idempotente. Cada llamada crea un nuevo préstamo
   * si es aprobada. Los tests que usan este método deben aislar el estado
   * (usuario distinto o verificar que la cuenta generada no interfiera
   * con otros tests).
   */
  async requestLoan(
    customerId: number,
    fromAccountId: number,
    amount: number,
    downPayment: number,
  ): Promise<LoanResponse> {
    const params = new URLSearchParams({
      customerId: String(customerId),
      fromAccountId: String(fromAccountId),
      loanAmount: String(amount),
      downPayment: String(downPayment),
    });
    return this.post<LoanResponse>(`/services/bank/requestloan?${params.toString()}`);
  }

  // ── Session ────────────────────────────────────────────────────────────────

  /**
   * Simula logout navegando al endpoint de cierre de sesión.
   * Parabank no tiene endpoint REST de logout — el logout es una GET a
   * /logout.htm que invalida el JSESSIONID en el servidor.
   * Usado en H-009 para verificar que la sesión queda efectivamente invalidada.
   */
  async logout(): Promise<void> {
    const response = await this.ctx().get(`${this.baseUrl}/logout.htm`, {
      headers: { Accept: 'text/html' },
    });
    // logout.htm redirige a index — cualquier 2xx/3xx se considera OK
    if (response.status() >= 500) {
      throw new ApiError(response.status(), await response.text(), 'GET /logout.htm');
    }
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Intenta registrar un usuario con un username ya existente.
   * Usado exclusivamente para documentar H-011 — el servidor no debería
   * aceptar este request, pero actualmente lo hace.
   */
  async registerDuplicateUser(username: string): Promise<void> {
    const params = new URLSearchParams({
      'customer.firstName': 'Test',
      'customer.lastName': 'Duplicate',
      'customer.address.street': '123 Test St',
      'customer.address.city': 'TestCity',
      'customer.address.state': 'CA',
      'customer.address.zipCode': '00000',
      'customer.phoneNumber': '5550000000',
      'customer.ssn': '000-00-0000',
      'customer.username': username,
      'customer.password': 'password123',
      'repeatedPassword': 'password123',
    });
    await this.post(`/parabank/register.htm?${params.toString()}`);
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  async getTransactionsForAccount(accountId: number): Promise<Transaction[]> {
    return this.get<Transaction[]>(`/services/bank/accounts/${accountId}/transactions`);
  }

  // ── HTTP primitives ────────────────────────────────────────────────────────

  private ctx(): APIRequestContext {
    if (!this.requestContext) {
      throw new Error(
        '[ApiClient] requestContext no inicializado. Llamá a init() antes de usar el cliente.',
      );
    }
    return this.requestContext;
  }

  private async get<T = void>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.ctx().get(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok()) {
      throw new ApiError(response.status(), await response.text(), `GET ${endpoint}`);
    }

    const text = await response.text();
    if (!text.trim()) return undefined as T;

    return JSON.parse(text) as T;
  }

  private async post<T = void>(endpoint: string, body?: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.ctx().post(url, {
      headers: { Accept: 'application/json' },
      data: body,
    });

    if (!response.ok()) {
      throw new ApiError(response.status(), await response.text(), `POST ${endpoint}`);
    }

    const text = await response.text();
    if (!text.trim()) return undefined as T;

    // Algunos endpoints devuelven texto plano (ej: /transfer → "Successfully transferred...")
    // Si no es JSON válido, retornamos el texto como T para no romper el caller
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}
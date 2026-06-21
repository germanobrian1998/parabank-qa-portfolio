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

import { APIRequestContext, request } from "@playwright/test";

// ─── Tipos públicos ───────────────────────────────────────────────────────────
// Los tipos se infieren desde los schemas Zod en lugar de definirse manualmente.
// Una sola fuente de verdad: el schema define tanto la validación como el tipo.

import type {
  Customer,
  Account,
  Transaction,
  LoanResponse,
} from "../../contracts/parabank.schemas";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    public readonly endpoint: string,
  ) {
    super(`[ApiClient] ${endpoint} → HTTP ${status}: ${body}`);
    this.name = "ApiError";
  }
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

export class ApiClient {
  private readonly baseUrl: string;
  private requestContext: APIRequestContext | null = null;

  constructor(
    baseUrl = `${process.env.BASE_URL || "http://localhost:9090"}/parabank`,
  ) {
    this.baseUrl = baseUrl;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    this.requestContext = await request.newContext({
      extraHTTPHeaders: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  async dispose(): Promise<void> {
    await this.requestContext?.dispose();
    this.requestContext = null;
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<Customer> {
    return this.get<Customer>(`/services/bank/login/${username}/${password}`);
  }

  // ── Accounts ───────────────────────────────────────────────────────────────

  async getAccountsForCustomer(customerId: number): Promise<Account[]> {
    return this.get<Account[]>(
      `/services/bank/customers/${customerId}/accounts`,
    );
  }

  async getAccount(accountId: number): Promise<Account> {
    return this.get<Account>(`/services/bank/accounts/${accountId}`);
  }

  // ── Transfers ──────────────────────────────────────────────────────────────

  async transfer(fromId: number, toId: number, amount: number): Promise<void> {
    const params = new URLSearchParams({
      fromAccountId: String(fromId),
      toAccountId: String(toId),
      amount: String(amount),
    });
    await this.post(`/services/bank/transfer?${params.toString()}`);
  }

  // ── Loans ──────────────────────────────────────────────────────────────────

  async requestLoan(
    customerId: number,
    fromAccountId: number,
    amount: number,
    downPayment: number,
  ): Promise<LoanResponse> {
    const params = new URLSearchParams({
      customerId: String(customerId),
      amount: String(amount),
      downPayment: String(downPayment),
      fromAccountId: String(fromAccountId),
    });
    return this.post<LoanResponse>(
      `/services/bank/requestLoan?${params.toString()}`,
    );
  }

  // ── Session ────────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const response = await this.ctx().get(`${this.baseUrl}/logout.htm`, {
      headers: { Accept: "text/html" },
    });
    if (response.status() >= 500) {
      throw new ApiError(
        response.status(),
        await response.text(),
        "GET /logout.htm",
      );
    }
  }

  // ── Registration ───────────────────────────────────────────────────────────

  async register(params: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    ssn: string;
    username: string;
    password: string;
  }): Promise<void> {

    // Forzar sesión completamente nueva antes del GET.
    // El servidor Spring MVC guarda el objeto Customer en @SessionAttributes
    // durante el GET. Si se reutiliza una sesión de una corrida anterior,
    // el POST falla con "username already exists" porque el servidor compara
    // contra el Customer que quedó en sesión, no contra la BD.
    await this.dispose();
    await this.init();

    const getResponse = await this.ctx().get(`${this.baseUrl}/register.htm`);
    if (!getResponse.ok()) {
      throw new ApiError(
        getResponse.status(),
        await getResponse.text(),
        "GET /register.htm (paso previo de sesión)",
      );
    }

    const formData = new URLSearchParams({
      "customer.firstName": params.firstName,
      "customer.lastName": params.lastName,
      "customer.address.street": params.street,
      "customer.address.city": params.city,
      "customer.address.state": params.state,
      "customer.address.zipCode": params.zipCode,
      "customer.phoneNumber": params.phoneNumber,
      "customer.ssn": params.ssn,
      "customer.username": params.username,
      "customer.password": params.password,
      repeatedPassword: params.password,
    });

    const cookies = await this.ctx().storageState();

    const postResponse = await this.ctx().post(`${this.baseUrl}/register.htm`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: formData.toString(),
    });

    if (!postResponse.ok()) {
      throw new ApiError(
        postResponse.status(),
        await postResponse.text(),
        "POST /register.htm",
      );
    }

    const body = await postResponse.text();
    if (body.trim() !== "" && !body.includes("Your account was created successfully")) {
      throw new ApiError(
        postResponse.status(),
        body,
        "POST /register.htm (HTTP 200 pero sin confirmación de éxito — posible error de validación)",
      );
    }
  }

  async registerDuplicateUser(username: string): Promise<void> {
    const params = new URLSearchParams({
      "customer.firstName": "Test",
      "customer.lastName": "Duplicate",
      "customer.address.street": "123 Test St",
      "customer.address.city": "TestCity",
      "customer.address.state": "CA",
      "customer.address.zipCode": "00000",
      "customer.phoneNumber": "5550000000",
      "customer.ssn": "000-00-0000",
      "customer.username": username,
      "customer.password": "password123",
      repeatedPassword: "password123",
    });
    await this.post(`/parabank/register.htm?${params.toString()}`);
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  async getTransactionsForAccount(accountId: number): Promise<Transaction[]> {
    return this.get<Transaction[]>(
      `/services/bank/accounts/${accountId}/transactions`,
    );
  }

  // ── HTTP primitives ────────────────────────────────────────────────────────

  private ctx(): APIRequestContext {
    if (!this.requestContext) {
      throw new Error(
        "[ApiClient] requestContext no inicializado. Llamá a init() antes de usar el cliente.",
      );
    }
    return this.requestContext;
  }

  private async get<T = void>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.ctx().get(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok()) {
      throw new ApiError(
        response.status(),
        await response.text(),
        `GET ${endpoint}`,
      );
    }

    const text = await response.text();
    if (!text.trim()) return undefined as T;

    return JSON.parse(text) as T;
  }

  private async post<T = void>(endpoint: string, body?: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.ctx().post(url, {
      headers: { Accept: "application/json" },
      data: body,
    });

    if (!response.ok()) {
      throw new ApiError(
        response.status(),
        await response.text(),
        `POST ${endpoint}`,
      );
    }

    const text = await response.text();
    if (!text.trim()) return undefined as T;

    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}
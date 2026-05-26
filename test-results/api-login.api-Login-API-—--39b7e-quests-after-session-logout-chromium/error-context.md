# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/login.api.spec.ts >> Login API — contract tests >> [BUG H-009] should reject authenticated requests after session logout
- Location: tests/api/login.api.spec.ts:102:7

# Error details

```
Error: Tras el logout, requests autenticados deben ser rechazados — la sesión debe estar invalidada en el servidor

expect(received).rejects.toThrow()

Received promise resolved instead of rejected
Resolved to value: [{"balance": -999003812, "customerId": 12212, "id": 12345, "type": "CHECKING"}, {"balance": 999997988.45, "customerId": 12212, "id": 12456, "type": "CHECKING"}, {"balance": 28, "customerId": 12212, "id": 12567, "type": "CHECKING"}, {"balance": -197, "customerId": 12212, "id": 12678, "type": "SAVINGS"}, {"balance": 78, "customerId": 12212, "id": 12789, "type": "CHECKING"}, {"balance": 50, "customerId": 12212, "id": 12900, "type": "CHECKING"}, {"balance": -5, "customerId": 12212, "id": 13011, "type": "CHECKING"}, {"balance": -4999270, "customerId": 12212, "id": 13122, "type": "CHECKING"}, {"balance": 0, "customerId": 12212, "id": 13233, "type": "CHECKING"}, {"balance": 4001626.1, "customerId": 12212, "id": 13344, "type": "SAVINGS"}, …]
```

# Test source

```ts
  30  |         expect(customer, 'El login debe retornar el objeto Customer').toMatchObject({
  31  |           id: expect.any(Number),
  32  |           firstName: expect.any(String),
  33  |           lastName: expect.any(String),
  34  |         });
  35  |         expect(
  36  |           customer.id,
  37  |           'El customerId de john/demo debe ser un número positivo',
  38  |         ).toBeGreaterThan(0);
  39  |       } finally {
  40  |         await client.dispose();
  41  |       }
  42  |     },
  43  |   );
  44  | 
  45  |   // ── Validación de credenciales ──────────────────────────────────────────────
  46  | 
  47  |   test(
  48  |     'should return HTTP 401 for invalid credentials',
  49  |     async () => {
  50  |       // WHY THIS TEST MATTERS: si el servidor devuelve 200 con credenciales
  51  |       // incorrectas, cualquier atacante puede acceder a cuentas ajenas con
  52  |       // fuerza bruta sin que el sistema lo detecte. Esto es un fallo de
  53  |       // autenticación básico con implicaciones regulatorias (PCI-DSS).
  54  | 
  55  |       const client = new ApiClient();
  56  |       await client.init();
  57  | 
  58  |       try {
  59  |         await expect(
  60  |           client.login('john', 'wrong-password'),
  61  |           'Credenciales inválidas deben resultar en rechazo HTTP, no en acceso',
  62  |         ).rejects.toThrow(ApiError);
  63  | 
  64  |         // Verificamos el status code específico
  65  |         try {
  66  |           await client.login('john', 'wrong-password');
  67  |         } catch (err) {
  68  |           expect(
  69  |             (err as ApiError).status,
  70  |             'El servidor debe retornar 4xx para credenciales incorrectas, no 2xx',
  71  |           ).toBeGreaterThanOrEqual(400);
  72  |         }
  73  |       } finally {
  74  |         await client.dispose();
  75  |       }
  76  |     },
  77  |   );
  78  | 
  79  |   test(
  80  |     'should return HTTP 401 for non-existent user',
  81  |     async () => {
  82  |       // WHY THIS TEST MATTERS: enumerar usuarios inexistentes no debe dar
  83  |       // información sobre qué usuarios existen en el sistema. Un 404 específico
  84  |       // vs un 401 genérico es una diferencia de information disclosure.
  85  | 
  86  |       const client = new ApiClient();
  87  |       await client.init();
  88  | 
  89  |       try {
  90  |         await expect(
  91  |           client.login('usuario-que-no-existe-xyz', 'cualquier-password'),
  92  |           'Un usuario inexistente debe ser rechazado con error HTTP',
  93  |         ).rejects.toThrow(ApiError);
  94  |       } finally {
  95  |         await client.dispose();
  96  |       }
  97  |     },
  98  |   );
  99  | 
  100 |   // ── Bugs documentados ───────────────────────────────────────────────────────
  101 | 
  102 |   test(
  103 |     '[BUG H-009] should reject authenticated requests after session logout',
  104 |     async () => {
  105 |       // WHY THIS TEST MATTERS: H-009 confirma que la sesión no se invalida
  106 |       // correctamente en el servidor tras el logout. Si un token/cookie robado
  107 |       // sigue siendo válido después de que el usuario cierra sesión, un atacante
  108 |       // con acceso a esa cookie puede seguir operando indefinidamente.
  109 |       // Esto viola el principio mínimo de gestión de sesiones (OWASP A07).
  110 | 
  111 |       test.fail(true, 'H-009: Session remains valid after logout — server does not invalidate JSESSIONID');
  112 | 
  113 |       const client = new ApiClient();
  114 |       await client.init();
  115 | 
  116 |       try {
  117 |         const customer = await client.login('john', 'demo');
  118 | 
  119 |         // Simular logout llamando al endpoint correspondiente
  120 |         // Parabank expone /parabank/logout.htm — no hay endpoint REST de logout,
  121 |         // el logout es navegación de UI. Lo simulamos con una GET directa.
  122 |         // Si el servidor invalida la sesión correctamente, el siguiente call
  123 |         // a una ruta protegida debe fallar con 401/403.
  124 |         await client.logout();
  125 | 
  126 |         // Este call debería fallar si la sesión fue invalidada correctamente
  127 |         await expect(
  128 |           client.getAccountsForCustomer(customer.id),
  129 |           'Tras el logout, requests autenticados deben ser rechazados — la sesión debe estar invalidada en el servidor',
> 130 |         ).rejects.toThrow(ApiError);
      |                   ^ Error: Tras el logout, requests autenticados deben ser rechazados — la sesión debe estar invalidada en el servidor
  131 |       } finally {
  132 |         await client.dispose();
  133 |       }
  134 |     },
  135 |   );
  136 | 
  137 |   test(
  138 |     '[BUG H-011] should reject registration with a duplicate username',
  139 |     async () => {
  140 |       // WHY THIS TEST MATTERS: H-011 documenta que el servidor acepta crear
  141 |       // usuarios con usernames ya existentes. Dos usuarios con el mismo username
  142 |       // generan ambigüedad en autenticación — el sistema podría resolver al
  143 |       // usuario incorrecto, otorgando acceso a cuentas ajenas.
  144 | 
  145 |       const client = new ApiClient();
  146 |       await client.init();
  147 | 
  148 |       try {
  149 |         // Intentar registrar a john de nuevo (username ya existe en el sistema)
  150 |         await expect(
  151 |           client.registerDuplicateUser('john'),
  152 |           'El servidor debe rechazar el registro de un username que ya existe en el sistema',
  153 |         ).rejects.toThrow(ApiError);
  154 |       } finally {
  155 |         await client.dispose();
  156 |       }
  157 |     },
  158 |   );
  159 | 
  160 | });
```
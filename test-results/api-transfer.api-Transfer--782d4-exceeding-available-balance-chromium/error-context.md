# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/transfer.api.spec.ts >> Transfer API — contract tests >> [BUG H-010] should reject transfer exceeding available balance
- Location: tests/api/transfer.api.spec.ts:123:7

# Error details

```
Error: El servidor debe rechazar transferencias que excedan el saldo disponible — actualmente permite overdraft ilimitado

expect(received).rejects.toThrow()

Received promise resolved instead of rejected
Resolved to value: undefined
```

# Test source

```ts
  40  |     client,
  41  |     fromAccountId: accounts[0].id,
  42  |     toAccountId: accounts[1].id,
  43  |   };
  44  | }
  45  | 
  46  | // ─────────────────────────────────────────────────────────────────────────────
  47  | 
  48  | test.describe('Transfer API — contract tests', () => {
  49  | 
  50  |   // ── Happy path ──────────────────────────────────────────────────────────────
  51  | 
  52  |   test(
  53  |     'should return HTTP 200 for a valid transfer between own accounts @smoke',
  54  |     async () => {
  55  |       // WHY THIS TEST MATTERS: el contrato mínimo del endpoint es que acepta
  56  |       // transferencias válidas sin error. Si este test falla, todos los demás
  57  |       // tests de negocio carecen de fundamento — el canal API está roto.
  58  | 
  59  |       const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
  60  | 
  61  |       try {
  62  |         await expect(
  63  |           client.transfer(fromAccountId, toAccountId, 10),
  64  |           'Una transferencia válida entre cuentas propias debe completarse sin error HTTP',
  65  |         ).resolves.not.toThrow();
  66  |       } finally {
  67  |         await client.dispose();
  68  |       }
  69  |     },
  70  |   );
  71  | 
  72  |   test(
  73  |     'should reflect debit on source account after transfer',
  74  |     async () => {
  75  |       // WHY THIS TEST MATTERS: un HTTP 200 no garantiza que el dinero se movió.
  76  |       // Este test verifica el efecto en la base de datos — si el saldo no cambia,
  77  |       // el banco tiene dinero fantasma circulando en el sistema.
  78  | 
  79  |       const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
  80  |       const transferAmount = 50;
  81  | 
  82  |       try {
  83  |         const before = await client.getAccount(fromAccountId);
  84  |         await client.transfer(fromAccountId, toAccountId, transferAmount);
  85  |         const after = await client.getAccount(fromAccountId);
  86  | 
  87  |         expect(
  88  |           after.balance,
  89  |           `El saldo de la cuenta origen debe reducirse en $${transferAmount} tras la transferencia`,
  90  |         ).toBeCloseTo(before.balance - transferAmount, 2);
  91  |       } finally {
  92  |         await client.dispose();
  93  |       }
  94  |     },
  95  |   );
  96  | 
  97  |   // ── Bugs documentados ───────────────────────────────────────────────────────
  98  | 
  99  |   test(
  100 |     '[BUG H-007] should reject transfer with negative amount at API level',
  101 |     async () => {
  102 |       // WHY THIS TEST MATTERS: H-007 fue confirmado en la UI (transfer.spec.ts).
  103 |       // Este test verifica si el servidor también lo acepta vía API directa,
  104 |       // sin pasar por ningún control del frontend. Si pasa, el bug es explotable
  105 |       // por cualquier cliente HTTP — no solo por el navegador.
  106 |       // Un atacante podría transferir montos negativos para extraer fondos.
  107 | 
  108 |       test.fail(true, 'H-007: API accepts negative transfer amount — server-side validation missing');
  109 | 
  110 |       const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
  111 | 
  112 |       try {
  113 |         await expect(
  114 |           client.transfer(fromAccountId, toAccountId, -500),
  115 |           'El servidor debe rechazar montos negativos con un error HTTP 4xx — actualmente los acepta',
  116 |         ).rejects.toThrow(ApiError);
  117 |       } finally {
  118 |         await client.dispose();
  119 |       }
  120 |     },
  121 |   );
  122 | 
  123 |   test(
  124 |     '[BUG H-010] should reject transfer exceeding available balance',
  125 |     async () => {
  126 |       // WHY THIS TEST MATTERS: H-010 confirma que el servidor no valida el saldo
  127 |       // disponible antes de ejecutar la transferencia. Un cliente puede vaciar
  128 |       // una cuenta hasta saldo negativo ilimitado — exposición financiera directa
  129 |       // para el banco sin ningún límite de crédito implícito.
  130 | 
  131 |       test.fail(true, 'H-010: API allows overdraft — transfer exceeding balance is accepted without error');
  132 | 
  133 |       const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
  134 | 
  135 |       try {
  136 |         // $999,999,999 garantiza que excede cualquier saldo de cuenta demo
  137 |         await expect(
  138 |           client.transfer(fromAccountId, toAccountId, 999_999_999),
  139 |           'El servidor debe rechazar transferencias que excedan el saldo disponible — actualmente permite overdraft ilimitado',
> 140 |         ).rejects.toThrow(ApiError);
      |                   ^ Error: El servidor debe rechazar transferencias que excedan el saldo disponible — actualmente permite overdraft ilimitado
  141 |       } finally {
  142 |         await client.dispose();
  143 |       }
  144 |     },
  145 |   );
  146 | 
  147 |   test(
  148 |     '[BUG H-007] transfer with negative amount should not increase source balance',
  149 |     async () => {
  150 |       // WHY THIS TEST MATTERS: si el servidor acepta montos negativos, la
  151 |       // transferencia de -$500 puede resultar en que la cuenta ORIGEN recibe
  152 |       // dinero en lugar de enviarlo — equivalente a una extracción no autorizada.
  153 |       // Este test cuantifica el impacto financiero concreto del bug H-007.
  154 | 
  155 |       test.fail(true, 'H-007: Negative transfer increases source balance — funds created from thin air');
  156 | 
  157 |       const { client, fromAccountId, toAccountId } = await setupAuthenticatedClient();
  158 | 
  159 |       try {
  160 |         const before = await client.getAccount(fromAccountId);
  161 |         await client.transfer(fromAccountId, toAccountId, -500);
  162 |         const after = await client.getAccount(fromAccountId);
  163 | 
  164 |         expect(
  165 |           after.balance,
  166 |           'Una transferencia con monto negativo no debe incrementar el saldo de la cuenta origen',
  167 |         ).toBeLessThanOrEqual(before.balance);
  168 |       } finally {
  169 |         await client.dispose();
  170 |       }
  171 |     },
  172 |   );
  173 | 
  174 | });
```
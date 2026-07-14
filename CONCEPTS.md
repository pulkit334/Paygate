# Concepts & Error Reading Guide

## 1. TypeScript Strict Mode (`noUnusedLocals`)

```typescript
// Error: 'copied' is declared but its value is never read
const [copied, setCopied] = useState(false)
//       ^^^^^^ unused variable
```

TypeScript has a compiler option `noUnusedLocals` that **flags any variable/function that is declared but never used**. This catches dead code and potential bugs.

**Why it matters:** Unused code is confusing — it suggests the developer intended to use it but forgot, or left behind incomplete logic.

---

## 2. Multi-Stage Docker Build

```dockerfile
# Stage 1: Build (compile TypeScript → JavaScript)
FROM node:20-alpine AS builder
RUN npm run build        # Creates /app/dist

# Stage 2: Run (only copy what's needed)
FROM node:20-alpine
COPY --from=builder /app/dist ./dist   # Expects dist/ to exist
```

**Concept:** Separate "build" from "run" to keep the final image small. But **Stage 2 depends on Stage 1 producing the expected output**.

---

## 3. Redux Typed Dispatch

```typescript
// Wrong: useDispatch() returns Dispatch<UnknownAction>
const dispatch = useDispatch()
dispatch(fetchSession())  // ❌ AsyncThunkAction not assignable to UnknownAction

// Right: Use typed dispatch
const dispatch = useDispatch<AppDispatch>()
dispatch(fetchSession())  // ✅ Knows about async thunks
```

**Concept:** Redux Toolkit's `createAsyncThunk` returns a special action type. The default `useDispatch()` doesn't know about it — you need the **store's specific dispatch type**.

---

## 4. Union Types vs `string`

```typescript
// Wrong: status is inferred as 'string'
function createTest(orderId: string, status = "created") { ... }
//                                      ^^^^^^ type: string

// Right: Explicit union type
function createTest(orderId: string, status: "created" | "paid" = "created") { ... }
//                                                 ^^^^^^^^^^^^ specific types
```

**Concept:** TypeScript infers `string` from default parameters. But Mongoose expects the **exact union type** from your interface — `string` is too broad.

---

## 5. How to Read Docker Build Errors

### Error Format

```
Dockerfile:12          <-- Line number where error occurred

  10 |     COPY package*.json ./
  11 |     RUN npm ci --omit=dev
  12 | >>> COPY --from=builder /app/dist ./dist   <-- This line failed
  13 |     COPY proto ./proto
  14 |     EXPOSE 50051

target backend1: failed to solve: ... "/app/dist": not found
```

### How to Parse It

| Part | Meaning |
|------|---------|
| `Dockerfile:12` | Error is on **line 12** of the Dockerfile |
| `>>>` | Points to the **exact failing instruction** |
| `COPY --from=builder /app/dist` | Trying to copy `/app/dist` from **builder stage** |
| `"/app/dist": not found` | The file/folder **doesn't exist** |

### Common Docker Build Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `"/app/dist": not found` | Build step failed silently | Check previous `RUN` commands |
| `npm ERR! missing script: build` | No `build` script in package.json | Add script or fix Dockerfile |
| `exit code: 2` | TypeScript/ESLint errors | Fix code errors first |
| `failed to compute cache key` | COPY source doesn't exist | Ensure previous stage produces output |

---

## 6. Key Principle

> **TypeScript catches errors at compile time. Docker catches them at build time. The earlier you fix them, the faster your feedback loop.**

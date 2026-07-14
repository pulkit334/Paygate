import AppError from "./Error.js";

const GrpcStatus = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
} as const;

interface GrpcError {
  code: number;
  message: string;
  details?: string;
}

//   UNAVAILABLE / DEADLINE_EXCEEDED → 503 (backend down)
//  UNAUTHENTICATED → 401 (bad credentials)
//  ALREADY_EXISTS → 409 (duplicate)
//  INVALID_ARGUMENT → 400 (bad input)
//   Everything else → 500 (unexpected)
 
export function mapGrpcError(err: GrpcError, context: string): AppError {
  const code = err.code;
  const msg = err.message || "Unknown gRPC error";

  switch (code) {
    case GrpcStatus.UNAVAILABLE:
    case GrpcStatus.DEADLINE_EXCEEDED:
      return AppError.Service(`${context}: merchant service unavailable (${msg})`);

    case GrpcStatus.UNAUTHENTICATED:
      return AppError.Auth(msg, 401);

    case GrpcStatus.PERMISSION_DENIED:
      return AppError.Auth(msg, 403);

    case GrpcStatus.ALREADY_EXISTS:
      return AppError.UniqueConstraint(msg, "email");

    case GrpcStatus.NOT_FOUND:
      return AppError.NotFound(msg);

    case GrpcStatus.INVALID_ARGUMENT:
      return AppError.Validation(msg);

    case GrpcStatus.RESOURCE_EXHAUSTED:
      return AppError.RateLimit(msg);

    case GrpcStatus.INTERNAL:
      return AppError.Service(`${context}: internal backend error (${msg})`);

    default:
      return AppError.Service(`${context}: unexpected error [code=${code}] (${msg})`);
  }
}






class AppError extends Error {
  constructor(
    message: string,
    public type: string,  
    public statusCode: number
  ) {
    super(message);
    this.name = type;
  }


  static Validation(message: string) {
    return new AppError(message, "ValidationError", 400);
  }

  static Auth(message: string, statusCode: number = 401) {
    return new AppError(message, "AuthError", statusCode);
  }
  
  static Payment(message: string) {
    return new AppError(message, "PaymentError", 400);
  }

  static RateLimit(message: string) {
    return new AppError(message, "RateLimitError", 429);
  }

  static Service(message: string) {
    return new AppError(message, "ServiceError", 503);
  }

  static DatabaseConnection(message: string = "Database connection failed") {
    return new AppError(message, "DatabaseConnectionError", 503);
  }

  static UniqueConstraint(message: string, field?: string) {
    const err = new AppError(message, "UniqueConstraintError", 409);
    (err as any).field = field;
    return err;
  }

  static NotFound(message: string = "Record not found") {
    return new AppError(message, "NotFoundError", 404);
  }

  static DataCorruption(message: string = "Data corruption detected") {
    return new AppError(message, "DataCorruptionError", 500);
  }

  static TooManyConnections(message: string = "Too many database connections") {
    return new AppError(message, "TooManyConnectionsError", 503);
  }

  // Webhooks
  static Webhook(message: string) {
    return new AppError(message, "WebhookError", 400);
  }
}

export default AppError;
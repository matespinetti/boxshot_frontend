export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class NotFoundError extends ApiError {
  constructor(resource?: string) {
    super(404, resource ? `${resource} not found` : "Not found")
    this.name = "NotFoundError"
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Network error - check your connection")
    this.name = "NetworkError"
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("Request timed out")
    this.name = "TimeoutError"
  }
}

// UnauthorizedError - add here in V2 (status 401, triggers redirect to /login)

import time
from collections import defaultdict
from typing import Callable, Dict, Tuple

from app.core.config import settings
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting API requests.

    Limits the number of requests a client can make within a specified time window.
    """

    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.rate_limit_enabled = settings.RATE_LIMIT_ENABLED
        self.rate_limit_requests = settings.RATE_LIMIT_REQUESTS
        self.rate_limit_window = settings.RATE_LIMIT_WINDOW_SECONDS
        # Use nested defaultdict to avoid KeyError
        self.request_counts = defaultdict(lambda: defaultdict(int))

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.rate_limit_enabled:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Check if client has exceeded rate limit
        current_time = time.time()
        window_start = current_time - self.rate_limit_window

        # Clean up old entries
        self._cleanup_old_entries(client_ip, window_start)

        # Count requests in current window
        request_count = self._count_requests(client_ip, window_start)

        # If rate limit exceeded, return 429 Too Many Requests
        if request_count >= self.rate_limit_requests:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Rate limit exceeded. Please try again later.",
                    "limit": self.rate_limit_requests,
                    "window_seconds": self.rate_limit_window,
                },
            )

        # Record this request - using defaultdict so no KeyError will occur
        self.request_counts[client_ip][current_time] += 1

        # Process the request
        return await call_next(request)

    def _cleanup_old_entries(self, client_ip: str, window_start: float) -> None:
        """Remove entries older than the rate limit window."""
        if client_ip in self.request_counts:
            # Create a new dict with only recent entries
            recent_entries = {ts: count for ts, count in self.request_counts[client_ip].items() if ts >= window_start}
            # Replace the old dict with the filtered one
            if recent_entries:
                self.request_counts[client_ip] = defaultdict(int, recent_entries)
            else:
                # If no recent entries, remove the client IP entirely
                del self.request_counts[client_ip]

    def _count_requests(self, client_ip: str, window_start: float) -> int:
        """Count requests in the current time window."""
        return sum(count for ts, count in self.request_counts[client_ip].items() if ts >= window_start)


def add_rate_limit_middleware(app: FastAPI) -> None:
    """Add rate limiting middleware to the FastAPI application."""
    app.add_middleware(RateLimitMiddleware)

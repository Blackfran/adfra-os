"""Simple in-memory rate limiter for login brute-force protection."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def too_many(self, key: str, max_attempts: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            bucket = [t for t in self._hits[key] if now - t < window_seconds]
            self._hits[key] = bucket
            return len(bucket) >= max_attempts

    def hit(self, key: str) -> None:
        with self._lock:
            self._hits[key].append(time.monotonic())

    def clear(self, key: str) -> None:
        with self._lock:
            self._hits.pop(key, None)


login_limiter = SlidingWindowLimiter()

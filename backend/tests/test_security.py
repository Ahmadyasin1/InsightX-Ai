"""Unit tests for core/security.py — token creation, hashing, decoding."""
import time
from datetime import timedelta

import pytest

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


pytestmark = pytest.mark.asyncio


class TestPasswordHashing:
    def test_hash_returns_bcrypt_string(self):
        hashed = hash_password("mypassword")
        assert hashed.startswith("$2b$")

    def test_hash_is_not_plaintext(self):
        hashed = hash_password("secret")
        assert hashed != "secret"

    def test_verify_correct_password(self):
        pw = "CorrectHorseBatteryStaple"
        assert verify_password(pw, hash_password(pw)) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("rightpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_different_salts(self):
        pw = "samepassword"
        h1 = hash_password(pw)
        h2 = hash_password(pw)
        # bcrypt uses random salts — hashes should differ
        assert h1 != h2


class TestTokenCreation:
    def test_access_token_created(self):
        token = create_access_token("user-123")
        assert isinstance(token, str)
        assert len(token) > 20

    def test_refresh_token_created(self):
        token = create_refresh_token("user-456")
        assert isinstance(token, str)
        assert len(token) > 20

    def test_access_and_refresh_tokens_differ(self):
        user_id = "user-789"
        access = create_access_token(user_id)
        refresh = create_refresh_token(user_id)
        assert access != refresh


class TestTokenDecoding:
    def test_decode_valid_access_token(self):
        user_id = "user-abc"
        token = create_access_token(user_id)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "access"

    def test_decode_valid_refresh_token(self):
        user_id = "user-def"
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"

    def test_decode_invalid_token_returns_none(self):
        result = decode_token("not.a.real.token")
        assert result is None

    def test_decode_empty_string_returns_none(self):
        result = decode_token("")
        assert result is None

    def test_decode_tampered_token_returns_none(self):
        token = create_access_token("user-xyz")
        tampered = token[:-5] + "XXXXX"
        result = decode_token(tampered)
        assert result is None

    def test_decode_expired_token_returns_none(self):
        token = create_access_token("user-exp", expires_delta=timedelta(seconds=-1))
        result = decode_token(token)
        assert result is None

"""Tests for register/login edge cases: email casing, long passwords, bad tokens."""


def _register(client, email="pm@example.com", password="secret123"):
    return client.post("/auth/register", json={"email": email, "password": password})


def _login(client, email="pm@example.com", password="secret123"):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_register_then_login(client):
    assert _register(client).status_code == 201
    resp = _login(client)
    assert resp.status_code == 200
    assert resp.json()["user"]["email"] == "pm@example.com"


def test_wrong_password_is_401(client):
    _register(client)
    assert _login(client, password="wrong-pass").status_code == 401


def test_email_is_case_insensitive(client):
    _register(client, email="Founder@Example.com")
    resp = _login(client, email="founder@example.com")
    assert resp.status_code == 200
    # Stored normalized, so the UI shows one canonical address.
    assert resp.json()["user"]["email"] == "founder@example.com"


def test_duplicate_email_differing_only_in_case_is_409(client):
    _register(client, email="pm@example.com")
    assert _register(client, email="PM@Example.com").status_code == 409


def test_password_longer_than_72_bytes(client):
    # bcrypt>=5 raises on >72 bytes; this used to be a 500.
    long_password = "correct horse battery staple " * 5
    assert _register(client, password=long_password).status_code == 201
    assert _login(client, password=long_password).status_code == 200


def test_malformed_token_is_401(client):
    resp = client.get("/projects", headers={"Authorization": "Bearer not-a-jwt"})
    assert resp.status_code == 401

"""Account features: session refresh, password change, and synced learning state."""

MSGS = [
    {"role": "user", "content": "What is RICE?"},
    {"role": "assistant", "content": "### RICE\nReach x Impact x Confidence / Effort."},
]


def test_refresh_issues_a_new_working_token(client, auth_headers):
    resp = client.post("/auth/refresh", headers=auth_headers)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert client.get("/projects", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_refresh_requires_a_valid_token(client):
    assert client.post("/auth/refresh", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_change_password(client, auth_headers):
    bad = client.put(
        "/auth/password",
        headers=auth_headers,
        json={"current_password": "wrong", "new_password": "newsecret1"},
    )
    assert bad.status_code == 400
    ok = client.put(
        "/auth/password",
        headers=auth_headers,
        json={"current_password": "secret123", "new_password": "newsecret1"},
    )
    assert ok.status_code == 204
    login = lambda pw: client.post("/auth/login", json={"email": "pm@example.com", "password": pw})
    assert login("secret123").status_code == 401
    assert login("newsecret1").status_code == 200


def test_learn_progress_roundtrip_and_sync(client, auth_headers):
    assert client.get("/me/learn-progress", headers=auth_headers).json() == {"completed": []}
    client.put("/me/learn-progress/what-is-product-management", headers=auth_headers)
    client.put("/me/learn-progress/what-is-product-management", headers=auth_headers)  # idempotent
    merged = client.post(
        "/me/learn-progress/sync",
        headers=auth_headers,
        json={"completed": ["personas", "what-is-product-management", "BAD SLUG!"]},
    ).json()["completed"]
    assert sorted(merged) == ["personas", "what-is-product-management"]
    after = client.delete("/me/learn-progress/personas", headers=auth_headers).json()
    assert after == {"completed": ["what-is-product-management"]}
    assert client.put("/me/learn-progress/Not_Valid", headers=auth_headers).status_code == 422


def test_mentor_chat_save_load_clear(client, auth_headers):
    assert client.get("/me/mentor-chat", headers=auth_headers).json() == {"messages": [], "topic": ""}
    saved = client.put(
        "/me/mentor-chat", headers=auth_headers, json={"messages": MSGS, "topic": "Personas"}
    )
    assert saved.status_code == 200
    assert client.get("/me/mentor-chat", headers=auth_headers).json() == {
        "messages": MSGS,
        "topic": "Personas",
    }
    # Saving again replaces (one conversation per user).
    client.put("/me/mentor-chat", headers=auth_headers, json={"messages": MSGS[:1], "topic": ""})
    assert len(client.get("/me/mentor-chat", headers=auth_headers).json()["messages"]) == 1
    assert client.delete("/me/mentor-chat", headers=auth_headers).status_code == 204
    assert client.get("/me/mentor-chat", headers=auth_headers).json()["messages"] == []


def test_me_routes_require_auth(client):
    assert client.get("/me/learn-progress").status_code in (401, 403)
    assert client.get("/me/mentor-chat").status_code in (401, 403)


def test_users_cannot_see_each_others_learning_state(client, auth_headers):
    client.put("/me/learn-progress/personas", headers=auth_headers)
    client.put("/me/mentor-chat", headers=auth_headers, json={"messages": MSGS, "topic": ""})
    other = client.post("/auth/register", json={"email": "other@example.com", "password": "secret123"})
    h2 = {"Authorization": f"Bearer {other.json()['access_token']}"}
    assert client.get("/me/learn-progress", headers=h2).json() == {"completed": []}
    assert client.get("/me/mentor-chat", headers=h2).json()["messages"] == []

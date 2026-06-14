"""Backend API tests for Finance YT Command Center."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://invest-hub-397.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@dashboard.local"
ADMIN_PASSWORD = "finance2026"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 20
        assert d["user"]["email"] == ADMIN_EMAIL

    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_token(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, auth):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Ideas ----------
class TestIdeas:
    def test_list_ideas_seeded(self, auth):
        r = requests.get(f"{BASE_URL}/api/ideas", headers=auth)
        assert r.status_code == 200
        ideas = r.json()
        assert isinstance(ideas, list) and len(ideas) >= 50

    def test_create_update_delete(self, auth):
        # create
        r = requests.post(f"{BASE_URL}/api/ideas", json={"title": "TEST_IDEA", "sub_niche": "investing", "rating": 8}, headers=auth)
        assert r.status_code == 200
        iid = r.json()["id"]
        # patch
        r2 = requests.patch(f"{BASE_URL}/api/ideas/{iid}", json={"title": "TEST_IDEA_UPDATED"}, headers=auth)
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_IDEA_UPDATED"
        # delete
        r3 = requests.delete(f"{BASE_URL}/api/ideas/{iid}", headers=auth)
        assert r3.status_code == 200

    def test_promote_idea(self, auth):
        r = requests.post(f"{BASE_URL}/api/ideas", json={"title": "TEST_PROMOTE", "sub_niche": "investing"}, headers=auth)
        iid = r.json()["id"]
        rp = requests.post(f"{BASE_URL}/api/ideas/{iid}/promote", headers=auth)
        assert rp.status_code == 200
        v = rp.json()
        assert v["stage"] == "script"
        assert v["title"] == "TEST_PROMOTE"
        # cleanup
        requests.delete(f"{BASE_URL}/api/ideas/{iid}", headers=auth)
        requests.delete(f"{BASE_URL}/api/videos/{v['id']}", headers=auth)


# ---------- Videos ----------
class TestVideos:
    def test_video_crud_and_stage(self, auth):
        r = requests.post(f"{BASE_URL}/api/videos", json={"title": "TEST_VIDEO", "sub_niche": "investing"}, headers=auth)
        assert r.status_code == 200
        vid = r.json()["id"]
        # stage transition
        r2 = requests.patch(f"{BASE_URL}/api/videos/{vid}", json={"stage": "voiceover"}, headers=auth)
        assert r2.status_code == 200
        assert r2.json()["stage"] == "voiceover"
        # get
        r3 = requests.get(f"{BASE_URL}/api/videos/{vid}", headers=auth)
        assert r3.status_code == 200 and r3.json()["stage"] == "voiceover"
        # list
        rl = requests.get(f"{BASE_URL}/api/videos", headers=auth)
        assert rl.status_code == 200
        # delete
        r4 = requests.delete(f"{BASE_URL}/api/videos/{vid}", headers=auth)
        assert r4.status_code == 200


# ---------- Analytics ----------
class TestAnalytics:
    def test_create_list(self, auth):
        r = requests.post(f"{BASE_URL}/api/analytics", json={
            "video_title": "TEST_AN", "date": "2026-01-15", "views": 100, "ctr": 5.5, "retention": 40.0, "adsense_earnings": 12.5
        }, headers=auth)
        assert r.status_code == 200
        aid = r.json()["id"]
        rl = requests.get(f"{BASE_URL}/api/analytics", headers=auth)
        assert rl.status_code == 200
        assert any(x["id"] == aid for x in rl.json())
        requests.delete(f"{BASE_URL}/api/analytics/{aid}", headers=auth)


# ---------- Affiliates ----------
class TestAffiliates:
    def test_create_list(self, auth):
        r = requests.post(f"{BASE_URL}/api/affiliates", json={
            "partner": "Groww", "month": "2026-01", "clicks": 100, "conversions": 5, "earnings": 500.0
        }, headers=auth)
        assert r.status_code == 200
        aid = r.json()["id"]
        rl = requests.get(f"{BASE_URL}/api/affiliates", headers=auth)
        assert rl.status_code == 200
        requests.delete(f"{BASE_URL}/api/affiliates/{aid}", headers=auth)


# ---------- Dashboard ----------
class TestDashboard:
    def test_summary(self, auth):
        r = requests.get(f"{BASE_URL}/api/dashboard/summary", headers=auth)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_videos", "by_stage", "total_views", "total_adsense", "total_affiliate", "total_earnings", "trend"]:
            assert k in d


# ---------- Settings ----------
class TestSettings:
    def test_key_lifecycle(self, auth):
        # Initially - may or may not be configured. Set a valid-looking key.
        fake_key = "sk-ant-test-" + "a" * 30
        r = requests.post(f"{BASE_URL}/api/settings/anthropic-key", json={"api_key": fake_key}, headers=auth)
        assert r.status_code == 200
        assert "preview" in r.json()
        # get
        r2 = requests.get(f"{BASE_URL}/api/settings/anthropic-key", headers=auth)
        assert r2.status_code == 200 and r2.json()["configured"] is True
        assert r2.json()["preview"].startswith("sk-ant-")
        # invalid key rejected
        r3 = requests.post(f"{BASE_URL}/api/settings/anthropic-key", json={"api_key": "short"}, headers=auth)
        assert r3.status_code == 400
        # delete
        r4 = requests.delete(f"{BASE_URL}/api/settings/anthropic-key", headers=auth)
        assert r4.status_code == 200
        r5 = requests.get(f"{BASE_URL}/api/settings/anthropic-key", headers=auth)
        assert r5.json()["configured"] is False


# ---------- Chat (verify 400 when no key) ----------
class TestChat:
    def test_no_key_returns_400(self, auth):
        # ensure key removed
        requests.delete(f"{BASE_URL}/api/settings/anthropic-key", headers=auth)
        r = requests.post(f"{BASE_URL}/api/chat/stream", json={
            "messages": [{"role": "user", "content": "hi"}]
        }, headers=auth)
        assert r.status_code == 400
        assert "No Anthropic API key" in r.text

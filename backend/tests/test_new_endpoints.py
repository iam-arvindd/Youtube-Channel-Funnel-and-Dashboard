"""Tests for new endpoints: YouTube key, Resend key, digest, youtube sync, thumbnail-gen 404."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://invest-hub-397.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@dashboard.local"
ADMIN_PASSWORD = "finance2026"


@pytest.fixture(scope="module")
def auth():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# ---------- Generic key storage (youtube / resend) ----------
class TestGenericKeys:
    def test_invalid_key_type_returns_400(self, auth):
        r = requests.get(f"{BASE_URL}/api/settings/keys/openai", headers=auth)
        assert r.status_code == 400

    def test_invalid_key_type_post_returns_400(self, auth):
        r = requests.post(f"{BASE_URL}/api/settings/keys/openai", headers=auth, json={"api_key": "abcdefghij"})
        assert r.status_code == 400

    def test_youtube_key_lifecycle(self, auth):
        # ensure clean state
        requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)

        # GET before set -> not configured
        r = requests.get(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        assert r.status_code == 200
        assert r.json()["configured"] is False

        # POST too short -> 400
        r = requests.post(f"{BASE_URL}/api/settings/keys/youtube", headers=auth, json={"api_key": "abc"})
        assert r.status_code == 400

        # POST dummy valid-length key
        dummy = "TEST_yt_dummy_key_AIzaSyDUMMYTOKEN1234"
        r = requests.post(f"{BASE_URL}/api/settings/keys/youtube", headers=auth, json={"api_key": dummy})
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert "preview" in body and "..." in body["preview"]

        # GET after set -> configured
        r = requests.get(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        assert r.status_code == 200
        d = r.json()
        assert d["configured"] is True
        assert "preview" in d

        # DELETE
        r = requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        assert r.status_code == 200
        assert r.json()["status"] == "removed"

        # GET after delete -> not configured
        r = requests.get(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        assert r.json()["configured"] is False

    def test_resend_key_lifecycle(self, auth):
        requests.delete(f"{BASE_URL}/api/settings/keys/resend", headers=auth)

        r = requests.get(f"{BASE_URL}/api/settings/keys/resend", headers=auth)
        assert r.json()["configured"] is False

        dummy = "TEST_re_dummy_key_re_123456789ABCDEF"
        r = requests.post(f"{BASE_URL}/api/settings/keys/resend", headers=auth, json={"api_key": dummy})
        assert r.status_code == 200

        r = requests.get(f"{BASE_URL}/api/settings/keys/resend", headers=auth)
        assert r.json()["configured"] is True

        r = requests.delete(f"{BASE_URL}/api/settings/keys/resend", headers=auth)
        assert r.status_code == 200

    def test_keys_require_auth(self):
        r = requests.get(f"{BASE_URL}/api/settings/keys/youtube")
        assert r.status_code == 401


# ---------- Digest config ----------
class TestDigest:
    def test_get_digest_default(self, auth):
        r = requests.get(f"{BASE_URL}/api/settings/digest", headers=auth)
        assert r.status_code == 200
        d = r.json()
        assert "enabled" in d and "email" in d

    def test_set_digest_enabled_without_email_400(self, auth):
        r = requests.post(f"{BASE_URL}/api/settings/digest", headers=auth, json={"enabled": True, "email": ""})
        assert r.status_code == 400

    def test_set_digest_and_retrieve(self, auth):
        payload = {"enabled": True, "email": "TEST_digest@example.com"}
        r = requests.post(f"{BASE_URL}/api/settings/digest", headers=auth, json=payload)
        assert r.status_code == 200

        r = requests.get(f"{BASE_URL}/api/settings/digest", headers=auth)
        d = r.json()
        assert d["enabled"] is True
        assert d["email"] == "TEST_digest@example.com"

        # disable to clean
        requests.post(f"{BASE_URL}/api/settings/digest", headers=auth, json={"enabled": False, "email": ""})

    def test_send_now_without_resend_key_returns_400(self, auth):
        # ensure resend key removed
        requests.delete(f"{BASE_URL}/api/settings/keys/resend", headers=auth)
        # ensure a digest email is set
        requests.post(f"{BASE_URL}/api/settings/digest", headers=auth, json={"enabled": True, "email": "TEST_d@example.com"})
        r = requests.post(f"{BASE_URL}/api/settings/digest/send-now", headers=auth)
        assert r.status_code == 400
        # cleanup
        requests.post(f"{BASE_URL}/api/settings/digest", headers=auth, json={"enabled": False, "email": ""})


# ---------- YouTube sync ----------
class TestYouTubeSync:
    @pytest.fixture(scope="class")
    def video_id(self, auth):
        r = requests.post(f"{BASE_URL}/api/videos", headers=auth, json={"title": "TEST_yt_sync_video"})
        assert r.status_code == 200
        vid = r.json()["id"]
        yield vid
        requests.delete(f"{BASE_URL}/api/videos/{vid}", headers=auth)

    def test_sync_no_youtube_url_returns_400(self, auth, video_id):
        # ensure key configured to ensure 400 is from missing URL not missing key
        # Actually code checks URL FIRST, so test without key still gets URL-missing 400
        requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        r = requests.post(f"{BASE_URL}/api/videos/{video_id}/youtube/sync", headers=auth)
        assert r.status_code == 400
        assert "URL" in r.json().get("detail", "")

    def test_sync_no_key_returns_400(self, auth, video_id):
        # Patch a valid YouTube URL on the video first
        requests.patch(
            f"{BASE_URL}/api/videos/{video_id}",
            headers=auth,
            json={"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        )
        requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        r = requests.post(f"{BASE_URL}/api/videos/{video_id}/youtube/sync", headers=auth)
        assert r.status_code == 400
        assert "YouTube Data API key" in r.json().get("detail", "") or "Resend" not in r.json().get("detail", "")

    def test_sync_video_not_found_404(self, auth):
        r = requests.post(f"{BASE_URL}/api/videos/nonexistent-id-xyz/youtube/sync", headers=auth)
        assert r.status_code == 404


# ---------- Extract video id helper (test 3 URL formats via the sync endpoint indirectly) ----------
class TestUrlParser:
    """Verify URL parser by setting URL and checking sync proceeds past URL validation."""

    @pytest.fixture(scope="class")
    def video_id(self, auth):
        r = requests.post(f"{BASE_URL}/api/videos", headers=auth, json={"title": "TEST_url_parser"})
        vid = r.json()["id"]
        yield vid
        requests.delete(f"{BASE_URL}/api/videos/{vid}", headers=auth)

    @pytest.mark.parametrize("url", [
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ])
    def test_url_formats_parsed(self, auth, video_id, url):
        requests.patch(f"{BASE_URL}/api/videos/{video_id}", headers=auth, json={"youtube_url": url})
        requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)
        r = requests.post(f"{BASE_URL}/api/videos/{video_id}/youtube/sync", headers=auth)
        # Past URL validation -> 400 about missing key (not URL error)
        assert r.status_code == 400
        detail = r.json().get("detail", "")
        assert "URL" not in detail, f"URL {url} not parsed: {detail}"
        assert "key" in detail.lower()

    def test_invalid_url_format_fails_validation(self, auth, video_id):
        requests.patch(f"{BASE_URL}/api/videos/{video_id}", headers=auth, json={"youtube_url": "https://example.com/no-id"})
        r = requests.post(f"{BASE_URL}/api/videos/{video_id}/youtube/sync", headers=auth)
        assert r.status_code == 400
        assert "URL" in r.json().get("detail", "")


# ---------- Thumbnail generation (only 404 path) ----------
class TestThumbnailGen:
    def test_thumbnail_gen_video_not_found(self, auth):
        r = requests.post(
            f"{BASE_URL}/api/videos/nonexistent-vid-abc/thumbnail/generate",
            headers=auth,
            json={"prompt": "test"},
        )
        assert r.status_code == 404


# ---------- Existing endpoints still work ----------
class TestExistingEndpoints:
    def test_ideas_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/ideas", headers=auth)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_videos_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/videos", headers=auth)
        assert r.status_code == 200

    def test_analytics_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/analytics", headers=auth)
        assert r.status_code == 200

    def test_affiliates_list(self, auth):
        r = requests.get(f"{BASE_URL}/api/affiliates", headers=auth)
        assert r.status_code == 200

    def test_dashboard_summary(self, auth):
        r = requests.get(f"{BASE_URL}/api/dashboard/summary", headers=auth)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_videos", "total_views", "total_earnings", "by_stage", "trend"]:
            assert k in d

    def test_anthropic_key_get(self, auth):
        r = requests.get(f"{BASE_URL}/api/settings/anthropic-key", headers=auth)
        assert r.status_code == 200
        assert "configured" in r.json()

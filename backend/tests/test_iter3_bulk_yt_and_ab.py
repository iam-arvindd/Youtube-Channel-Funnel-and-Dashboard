"""Iteration 3 tests: Bulk YouTube sync + Thumbnail A/B tracker."""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
ADMIN_EMAIL = "admin@dashboard.local"
ADMIN_PASSWORD = "finance2026"


@pytest.fixture(scope="session")
def auth():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# Tiny 1x1 PNG
PNG_BYTES = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
)


def _ensure_yt_key_absent(auth):
    requests.delete(f"{BASE_URL}/api/settings/keys/youtube", headers=auth)


def _set_dummy_yt_key(auth):
    r = requests.post(f"{BASE_URL}/api/settings/keys/youtube",
                      json={"api_key": "AIzaSyDummy12345_test_only"}, headers=auth)
    assert r.status_code == 200, r.text


# ---------- POST /api/youtube/sync-all ----------
class TestBulkYTSync:
    def test_sync_all_400_when_no_key(self, auth):
        _ensure_yt_key_absent(auth)
        r = requests.post(f"{BASE_URL}/api/youtube/sync-all", headers=auth)
        assert r.status_code == 400
        assert "YouTube Data API key" in r.text

    def test_sync_all_with_dummy_key_no_videos_with_url(self, auth):
        # remove any videos with youtube_url to ensure empty branch
        vids = requests.get(f"{BASE_URL}/api/videos", headers=auth).json()
        cleared = []
        for v in vids:
            if v.get("youtube_url"):
                # Clear url to make this branch empty
                requests.patch(f"{BASE_URL}/api/videos/{v['id']}",
                               json={"youtube_url": ""}, headers=auth)
                cleared.append(v["id"])
        _set_dummy_yt_key(auth)
        try:
            r = requests.post(f"{BASE_URL}/api/youtube/sync-all", headers=auth)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["synced"] == 0
            assert data["total"] == 0
            assert "results" in data
        finally:
            _ensure_yt_key_absent(auth)

    def test_single_video_sync_400_when_no_key(self, auth):
        _ensure_yt_key_absent(auth)
        # create a tmp video
        v = requests.post(f"{BASE_URL}/api/videos", json={"title": "TEST_YT_SYNC"}, headers=auth).json()
        # set a youtube_url
        requests.patch(f"{BASE_URL}/api/videos/{v['id']}",
                       json={"youtube_url": "https://youtu.be/dQw4w9WgXcQ"}, headers=auth)
        r = requests.post(f"{BASE_URL}/api/videos/{v['id']}/youtube/sync", headers=auth)
        assert r.status_code == 400
        assert "YouTube Data API key" in r.text
        requests.delete(f"{BASE_URL}/api/videos/{v['id']}", headers=auth)


# ---------- Thumbnail A/B tracker ----------
@pytest.fixture
def test_video(auth):
    v = requests.post(f"{BASE_URL}/api/videos", json={"title": "TEST_THUMB_AB"}, headers=auth).json()
    yield v
    requests.delete(f"{BASE_URL}/api/videos/{v['id']}", headers=auth)


def _upload_thumb(auth, vid, variant):
    files = {"file": ("t.png", io.BytesIO(PNG_BYTES), "image/png")}
    r = requests.post(
        f"{BASE_URL}/api/videos/{vid}/upload",
        params={"kind": "thumbnail", "variant": variant},
        files=files,
        headers=auth,
    )
    return r


class TestThumbnailAB:
    def test_upload_with_variant_ai(self, auth, test_video):
        r = _upload_thumb(auth, test_video["id"], "ai")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["variant"] == "ai"
        assert "url" in d
        # verify via list
        rl = requests.get(f"{BASE_URL}/api/videos/{test_video['id']}/thumbnails", headers=auth)
        assert rl.status_code == 200
        thumbs = rl.json()
        ai = [t for t in thumbs if t["id"] == d["id"]][0]
        assert ai["variant"] == "ai"
        assert ai["ctr"] == 0.0
        assert ai["impressions"] == 0
        assert ai["clicks"] == 0
        assert ai["url"].startswith("/api/files/")

    def test_upload_defaults_to_human(self, auth, test_video):
        files = {"file": ("t.png", io.BytesIO(PNG_BYTES), "image/png")}
        r = requests.post(
            f"{BASE_URL}/api/videos/{test_video['id']}/upload",
            params={"kind": "thumbnail"},
            files=files,
            headers=auth,
        )
        assert r.status_code == 200, r.text
        assert r.json()["variant"] == "human"

    def test_list_thumbnails_excludes_deleted(self, auth, test_video):
        r1 = _upload_thumb(auth, test_video["id"], "human")
        r2 = _upload_thumb(auth, test_video["id"], "ai")
        assert r1.status_code == 200 and r2.status_code == 200
        fid_del = r1.json()["id"]
        # delete one
        rd = requests.delete(f"{BASE_URL}/api/thumbnails/{fid_del}", headers=auth)
        assert rd.status_code == 200
        rl = requests.get(f"{BASE_URL}/api/videos/{test_video['id']}/thumbnails", headers=auth)
        ids = [t["id"] for t in rl.json()]
        assert fid_del not in ids
        assert r2.json()["id"] in ids

    def test_patch_auto_computes_ctr(self, auth, test_video):
        r = _upload_thumb(auth, test_video["id"], "ai")
        fid = r.json()["id"]
        rp = requests.patch(f"{BASE_URL}/api/thumbnails/{fid}",
                            json={"impressions": 1000, "clicks": 50}, headers=auth)
        assert rp.status_code == 200, rp.text
        d = rp.json()
        assert d["impressions"] == 1000
        assert d["clicks"] == 50
        assert d["ctr"] == 5.0  # 50/1000*100

    def test_patch_ctr_only_works(self, auth, test_video):
        r = _upload_thumb(auth, test_video["id"], "human")
        fid = r.json()["id"]
        rp = requests.patch(f"{BASE_URL}/api/thumbnails/{fid}",
                            json={"ctr": 7.25}, headers=auth)
        assert rp.status_code == 200, rp.text
        assert rp.json()["ctr"] == 7.25

    def test_patch_404_when_missing(self, auth):
        rp = requests.patch(f"{BASE_URL}/api/thumbnails/nonexistent-id-xyz",
                            json={"ctr": 5.0}, headers=auth)
        assert rp.status_code == 404

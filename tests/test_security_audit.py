import unittest
from app import create_app
from extensions import db
from models import User

class SecurityAuditTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.app.config["DEMO_AUTO_LOGIN"] = False
        self.app.config["DEMO_ROLE_SWITCHER"] = False
        self.client = self.app.test_client()

    def test_unauthenticated_dashboard_redirects_to_login(self):
        """Verify unauthenticated user cannot access dashboard."""
        res = self.client.get("/dashboard")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/login", res.headers.get("Location", ""))

    def test_unauthenticated_patients_redirects_to_login(self):
        """Verify unauthenticated user cannot access patient directory."""
        res = self.client.get("/patients/")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/login", res.headers.get("Location", ""))

    def test_unauthenticated_backup_download_blocked(self):
        """Verify unauthenticated attacker cannot exfiltrate database backup."""
        res = self.client.get("/audit/backup/download")
        self.assertEqual(res.status_code, 302)
        self.assertIn("/login", res.headers.get("Location", ""))

    def test_bad_password_fails_authentication(self):
        """Verify incorrect password does not authenticate user."""
        res = self.client.post("/login", data={
            "username": "admin",
            "password": "WrongPassword!999"
        }, follow_redirects=True)
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Invalid username or password", res.data)

    def test_security_headers_present(self):
        """Verify mandatory OWASP security headers on HTTP responses."""
        res = self.client.get("/login")
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "SAMEORIGIN")
        self.assertEqual(res.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertIn("Content-Security-Policy", res.headers)
        self.assertEqual(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")

    def test_robots_txt_disallows_indexing(self):
        """Verify search crawlers are instructed not to index patient intranet."""
        res = self.client.get("/robots.txt")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"Disallow: /", res.data)

    def test_disabled_quick_login_in_production(self):
        """Verify 1-click role switcher endpoint is blocked when DEMO_ROLE_SWITCHER=False."""
        res = self.client.get("/quick-login/admin", follow_redirects=True)
        self.assertIn(b"Quick role switching is disabled", res.data)

if __name__ == "__main__":
    unittest.main()

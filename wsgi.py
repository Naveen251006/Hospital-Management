"""
Production WSGI Entrypoint for CarePulse Hospital Management System (HMS)
Compatible with Gunicorn, Waitress, uWSGI, and cloud container deployments.
"""
import os
from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    try:
        from waitress import serve
        print(f"[WSGI Production Server] Serving with Waitress on http://0.0.0.0:{port}")
        serve(app, host="0.0.0.0", port=port)
    except ImportError:
        # Fallback runner for local verification
        app.run(host="127.0.0.1", port=port, debug=False)

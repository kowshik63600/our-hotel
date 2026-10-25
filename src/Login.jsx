
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./Login.css";

export default function Login({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handlePageMouseMove(e) {
    const page = e.currentTarget;
    page.style.setProperty("--cursor-x", `${e.clientX}px`);
    page.style.setProperty("--cursor-y", `${e.clientY}px`);
  }

function handleSideMouseMove(e) {
  const side = e.currentTarget;
  const rect = side.getBoundingClientRect();

  side.style.setProperty("--side-x", `${e.clientX - rect.left}px`);
  side.style.setProperty("--side-y", `${e.clientY - rect.top}px`);
  side.classList.add("cursor-active");
}

function handleSideMouseLeave(e) {
  e.currentTarget.classList.remove("cursor-active");
}


  function handleCardMouseMove(e) {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    card.style.setProperty("--spot-x", `${x * 100}%`);
    card.style.setProperty("--spot-y", `${y * 100}%`);
    card.style.setProperty("--tilt-x", `${(0.5 - y) * 4}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 5}deg`);
  }

  function resetCard(e) {
    const card = e.currentTarget;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--spot-x", "50%");
    card.style.setProperty("--spot-y", "50%");
  }

  function handleButtonMouseMove(e) {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    const x = (e.clientX - rect.left - rect.width / 2) * 0.10;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.14;

    button.style.setProperty("--mag-x", `${x}px`);
    button.style.setProperty("--mag-y", `${y}px`);
  }

  function resetButton(e) {
    e.currentTarget.style.setProperty("--mag-x", "0px");
    e.currentTarget.style.setProperty("--mag-y", "0px");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password) {
      setError("Enter your login ID and password.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, userId.trim(), password);
      onLogin?.();
    } catch {
      setError(
        "Unable to sign in. Check your details or contact your administrator."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" onMouseMove={handlePageMouseMove}>
      <div className="cursor-aura" aria-hidden="true" />

      <section className="login-showcase">
        <div className="showcase-top">
          <div className="showcase-logo">H<span>.</span></div>
          <span className="showcase-brand">HOTEL DESK</span>
        </div>

        <div className="showcase-content">
          <p className="showcase-kicker">
            <span /> HOSPITALITY, REFINED
          </p>

          <h1>
            Every detail.
            <br />
            <span>Under control.</span>
          </h1>

          <p className="showcase-description">
            A smarter way to manage your daily operations,
            track performance and keep your business moving.
          </p>

          <div className="showcase-ornament" aria-hidden="true">
            <div className="ornament-ring ring-one" />
            <div className="ornament-ring ring-two" />
            <div className="ornament-ring ring-three" />
            <div className="ornament-center">
              <span>H</span>
              <i />
            </div>
          </div>
        </div>

        <div className="showcase-bottom">
          <span>BUILT FOR BETTER OPERATIONS</span>
          <span>01 — HOTEL DESK</span>
        </div>
      </section>

<section
  className="login-side"
  onMouseMove={handleSideMouseMove}
  onMouseLeave={handleSideMouseLeave}
>        <div className="login-mobile-brand">
          <div className="showcase-logo">H<span>.</span></div>
          <span>HOTEL DESK</span>
        </div>

        <div
          className="login-form-wrap"
          onMouseMove={handleCardMouseMove}
          onMouseLeave={resetCard}
        >
          <div className="login-form-heading">
            <p className="form-kicker">STAFF PORTAL</p>
            <h2>Welcome back<span>.</span></h2>
            <p>Sign in to continue to your workspace.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="login-id">LOGIN ID</label>
              <input
                id="login-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your staff ID"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <div className="password-label-row">
                <label htmlFor="login-password">PASSWORD</label>
              </div>

              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">{error}</p>
            )}

            <button
              className="login-submit"
              type="submit"
              disabled={loading}
              onMouseMove={handleButtonMouseMove}
              onMouseLeave={resetButton}
            >
              <span>{loading ? "Signing in..." : "Sign in to workspace"}</span>
              <span className="submit-arrow">↗</span>
            </button>
          </form>

          <div className="login-security-note">
            <span className="security-symbol">◇</span>
            <span>Authorized staff access only</span>
          </div>
        </div>

        <footer className="login-side-footer">
          <span>HOTEL DESK MANAGEMENT</span>
          <span>© {new Date().getFullYear()}</span>
        </footer>
      </section>
    </main>
  );
}

import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(password);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-page">
    <section className="login-card">
      <div className="login-mark" aria-hidden="true"><span>D</span></div>
      <p className="login-eyebrow">Project Document System</p>
      <h1>Masuk ke aplikasi</h1>
      <p className="login-description">Masukkan password untuk mengakses data proyek dan membuat dokumen.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" autoComplete="current-password" autoFocus required
          value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="button primary login-button" type="submit" disabled={loading}>
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
      <p className="login-note">Session akan berakhir otomatis setelah 5 jam.</p>
    </section>
  </main>;
}

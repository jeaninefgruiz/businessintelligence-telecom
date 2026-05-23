import { useAuth } from "@/lib/auth";

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border-c)",
          borderRadius: "var(--radius)",
          padding: "40px 32px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-head)",
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: "0.04em",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--blue)",
            }}
          />
          SUPERCOMM
        </div>
        <div
          style={{
            color: "var(--text3)",
            fontSize: 13,
            marginBottom: 28,
          }}
        >
          Inteligência de Mercado ISP
        </div>
        <h1
          style={{
            fontFamily: "var(--font-head)",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Acesso restrito
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 28 }}>
          Entre com sua conta Google para acessar o painel.
        </p>
        <button
          onClick={() => signInWithGoogle().catch((e) => alert(e.message))}
          style={{
            width: "100%",
            height: 44,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "var(--bg3)",
            border: "1px solid var(--border-c)",
            borderRadius: 8,
            color: "var(--text)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <GoogleIcon />
          Entrar com Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

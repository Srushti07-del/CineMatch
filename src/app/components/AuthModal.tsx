import { useState, useRef, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";

export function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: { displayName: string; email: string }) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, [mode]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("auth-modal-backdrop")) {
      onClose();
    }
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (mode === "signup") {
      if (!displayName.trim()) {
        setErrorMsg("Display name is required.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    // Mock successful authentication
    console.log(`Executing ${mode} for ${email}`);
    
    // For login, we mock a display name if not provided
    const userDisplayName = mode === "signup" ? displayName : email.split("@")[0];
    
    onSuccess({ displayName: userDisplayName, email });
  };

  return (
    <div
      className="auth-modal-backdrop"
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        background: "linear-gradient(180deg, #0a0a0e, #06060A)",
        borderRadius: 24, border: "1px solid rgba(229,9,20,0.32)",
        boxShadow: "0 0 56px rgba(229,9,20,0.45), 0 32px 64px rgba(0,0,0,0.6)",
        padding: 36, maxWidth: 440, width: "92%",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(240,239,250,0.4)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        <h2 style={{
          fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 28,
          color: "white", margin: "0 0 4px", letterSpacing: "-0.02em"
        }}>
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p style={{
          fontFamily: "Inter,sans-serif", fontSize: 14,
          color: "rgba(240,239,250,0.45)", margin: "0 0 28px"
        }}>
          {mode === "login" ? "Log in to save your matches and connect with friends." : "Join CineMatch to sync your watchlist and find perfect matches."}
        </p>

        {errorMsg && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 16,
            background: "rgba(229,9,20,0.12)", border: "1px solid rgba(229,9,20,0.35)",
            color: "#ff8b94", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 500,
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(240,239,250,0.7)", marginBottom: 8 }}>Display Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required={mode === "signup"}
                style={{
                  width: "100%", padding: "14px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "white", fontFamily: "Inter,sans-serif", fontSize: 15,
                  outline: "none", transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(229,9,20,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              />
            </div>
          )}

          <div>
            <label style={{ display: "block", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(240,239,250,0.7)", marginBottom: 8 }}>Email</label>
            <input
              ref={emailInputRef}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "white", fontFamily: "Inter,sans-serif", fontSize: 15,
                outline: "none", transition: "border-color 0.2s, background 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(229,9,20,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={{ fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(240,239,250,0.7)" }}>Password</label>
              {mode === "login" && (
                <button type="button" style={{ background: "none", border: "none", color: "rgba(229,9,20,0.8)", fontFamily: "Inter,sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = "#E50914"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(229,9,20,0.8)"}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "14px 44px 14px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "white", fontFamily: "Inter,sans-serif", fontSize: 15,
                  outline: "none", transition: "border-color 0.2s, background 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={e => { e.currentTarget.style.borderColor = "rgba(229,9,20,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "rgba(240,239,250,0.5)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label style={{ display: "block", fontFamily: "Inter,sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(240,239,250,0.7)", marginBottom: 8 }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required={mode === "signup"}
                  style={{
                    width: "100%", padding: "14px 44px 14px 18px", borderRadius: 14,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "white", fontFamily: "Inter,sans-serif", fontSize: 15,
                    outline: "none", transition: "border-color 0.2s, background 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(229,9,20,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "rgba(240,239,250,0.5)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px", borderRadius: 14, border: "none", marginTop: 8,
              background: "linear-gradient(135deg,#B20710,#E50914)",
              color: "white", fontFamily: "Inter,sans-serif", fontSize: 15, fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 0 32px rgba(229,9,20,0.4), 0 8px 24px rgba(0,0,0,0.4)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(229,9,20,0.5), 0 10px 28px rgba(0,0,0,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(229,9,20,0.4), 0 8px 24px rgba(0,0,0,0.4)"; }}
          >
            {mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ padding: "0 12px", fontFamily: "Inter,sans-serif", fontSize: 12, color: "rgba(240,239,250,0.4)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button
          type="button"
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(240,239,250,0.9)", fontFamily: "Inter,sans-serif", fontSize: 14, fontWeight: 600,
            cursor: "pointer", transition: "background 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: "center", fontFamily: "Inter,sans-serif", fontSize: 13, color: "rgba(240,239,250,0.5)", marginTop: 24, marginBottom: 0 }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setEmail(""); setPassword(""); setDisplayName(""); setConfirmPassword(""); setErrorMsg(""); }}
            style={{ background: "none", border: "none", color: "white", fontWeight: 700, fontFamily: "Inter,sans-serif", fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>

      </div>
    </div>
  );
}

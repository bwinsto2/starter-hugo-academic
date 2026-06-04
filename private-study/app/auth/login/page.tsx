import { signIn, signUp } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Private study portal</p>
        <h1>Auditory Psychophysics Study</h1>
        <p className="lede">
          Create a participant account or log in with your existing email and password. This app is
          intentionally private and is not linked from the public site.
        </p>

        {params.error ? <div className="notice error">{params.error}</div> : null}
        {params.message ? <div className="notice success">{params.message}</div> : null}

        <div className="auth-grid">
          <form action={signUp} className="stacked-form">
            <h2>Create account</h2>
            <label>
              Email
              <input name="signupEmail" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="signupPassword" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <div className="two-column-fields">
              <label>
                First name
                <input name="firstName" autoComplete="given-name" required />
              </label>
              <label>
                Last name
                <input name="lastName" autoComplete="family-name" required />
              </label>
            </div>
            <div className="two-column-fields">
              <label>
                Sex
                <select name="sex" required>
                  <option value="">Select</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="intersex">Intersex</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
              <label>
                Age
                <input name="age" type="number" min={18} max={120} required />
              </label>
            </div>
            <button type="submit">Sign up</button>
          </form>

          <form action={signIn} className="stacked-form auth-divider">
            <h2>Log in</h2>
            <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button type="submit">Log in</button>
          </form>
        </div>
      </section>
    </main>
  );
}

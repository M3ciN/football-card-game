"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// 🔎 mapowanie kodów Firebase na PL-komunikaty
const fbError = (code: string) => {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Ten e-mail jest już zarejestrowany.",
    "auth/invalid-email": "Nieprawidłowy adres e-mail.",
    "auth/weak-password": "Hasło musi mieć co najmniej 6 znaków.",
    "auth/wrong-password": "Błędne hasło.",
    "auth/user-not-found": "Użytkownik nie istnieje.",
  };
  return map[code] ?? "Wystąpił nieznany błąd. Spróbuj ponownie.";
};

export default function AuthPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 jeśli user już zalogowany → dashboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/dashboard");
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // prosta walidacja
    if (!form.email.includes("@")) {
      setError("Wprowadź prawidłowy e-mail.");
      return;
    }
    if (form.password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        router.push("/dashboard");
      } else {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
        router.push("/setup-profile"); // strona uzupełnienia nicku i drużyny
      }
    } catch (err: any) {
      setError(fbError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-800 rounded-lg p-6 space-y-4 text-white shadow-lg"
      >
        <h1 className="text-center text-2xl font-bold">
          {isLogin ? "Logowanie" : "Rejestracja"}
        </h1>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 rounded text-black"
          required
        />

        <input
          type="password"
          placeholder="Hasło"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 rounded text-black"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded disabled:opacity-50"
        >
          {loading ? "⏳" : isLogin ? "Zaloguj się" : "Zarejestruj się"}
        </button>

        <p className="text-center text-sm">
          {isLogin ? "Nie masz konta?" : "Masz już konto?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 underline"
          >
            {isLogin ? "Zarejestruj się" : "Zaloguj się"}
          </button>
        </p>
      </form>
    </div>
  );
}

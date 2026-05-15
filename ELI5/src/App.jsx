import { useState, useRef, useEffect } from "react";

const LEVEL_LABELS = {
  1: "Toddler",
  2: "Age 5",
  3: "Age 8",
  4: "Age 10",
  5: "Middle School",
  6: "High School",
  7: "College",
  8: "Graduate",
  9: "Expert",
  10: "PhD",
};

// ─── Dynamic Prompt Engine ───────────────────────────────────────────────────
const LEVEL_TIERS = {
  toddler: {
    range: [1, 2],
    persona: "a warm, enthusiastic caregiver talking to a toddler aged 1–3",
    tone: "super cheerful, slow, sing-song, full of wonder and encouragement",
    vocabulary:
      "only the simplest everyday words a toddler knows (e.g. big, yummy, soft, go, yay). Absolutely NO words with more than 2 syllables unless they are the topic itself.",
    sentences: "very short (3–6 words each). Use exclamation marks freely.",
    analogies: "compare to toys, animals, food, hugs, or things a baby sees at home",
    depth: "one single fun idea only — no details, no 'why', just 'what it feels like'",
    length: "2–3 sentences max",
    extras: "sprinkle in a sound effect or onomatopoeia (e.g. whoosh, splat, zoom) where natural",
  },
  child: {
    range: [3, 4],
    persona: "a fun teacher talking to a curious 6–10 year old",
    tone: "friendly, playful, encouraging, like a favourite aunt or uncle",
    vocabulary:
      "simple everyday words; introduce ONE new word per explanation and immediately define it in brackets",
    sentences: "short to medium (8–12 words). Mix simple statements with one rhetorical question to spark curiosity.",
    analogies: "use familiar things: school, playground, cartoons, Lego, pizza, pets",
    depth: "explain the core idea and one interesting 'why', no sub-topics",
    length: "3–4 sentences",
    extras: "end with a fun 'Did you know?' hook that leaves them wanting more",
  },
  teenager: {
    range: [5, 6],
    persona: "a cool older sibling or relatable mentor talking to a 12–17 year old",
    tone: "casual, direct, slightly witty — no cringe, no condescension",
    vocabulary:
      "normal conversational language; 1–2 domain-specific terms are okay if immediately explained with a clear analogy",
    sentences: "varied length; use a punchy one-liner where appropriate to drive the point home",
    analogies: "relate to social media, gaming, sports, streaming, or pop culture",
    depth: "the main concept + how it works + one real-world consequence or application",
    length: "4–5 sentences",
    extras: "include a concrete 'this is why it matters to you right now' moment",
  },
  college: {
    range: [7, 8],
    persona: "a knowledgeable peer or TA talking to an undergraduate/grad student",
    tone: "intellectually engaged, precise, collegial — assume they're smart and motivated",
    vocabulary:
      "field-appropriate terminology is expected and used correctly; define only genuinely obscure jargon",
    sentences: "full, well-structured sentences; one complex sentence with a subordinate clause is fine",
    analogies: "draw on cross-disciplinary examples (economics, physics, history) to illuminate the concept",
    depth: "core mechanism + underlying principles + nuances or edge cases worth knowing",
    length: "5–6 sentences",
    extras: "mention a real-world application, open problem, or common misconception to challenge their thinking",
  },
  expert: {
    range: [9, 10],
    persona: "a peer expert or domain specialist in a high-level technical discussion",
    tone: "precise, dense, respectful of their expertise — no hand-holding",
    vocabulary:
      "full technical lexicon; assume PhD-level familiarity with the field's standard notation and terminology",
    sentences: "dense, information-rich sentences; subordinate clauses and parentheticals are appropriate",
    analogies: "only if they add precision; prefer formal definitions, quantitative relationships, or first-principles derivations",
    depth: "rigorous mechanistic explanation + theoretical underpinnings + current research frontier or open questions",
    length: "5–7 sentences",
    extras: "cite one specific challenge, debate, or recent development at the cutting edge of this topic",
  },
};

function getTier(level) {
  return Object.values(LEVEL_TIERS).find(
    (t) => level >= t.range[0] && level <= t.range[1]
  );
}

function buildPrompt(topic, level) {
  const label = LEVEL_LABELS[level];
  const tier = getTier(level);

  return `You are ${tier.persona}.

Your task is to explain the topic "${topic}" to someone at complexity level ${level}/10 (${label}).

Follow these rules STRICTLY:

TONE: ${tier.tone}
VOCABULARY: ${tier.vocabulary}
SENTENCE STRUCTURE: ${tier.sentences}
ANALOGIES: ${tier.analogies}
DEPTH: ${tier.depth}
LENGTH: ${tier.length}
BONUS: ${tier.extras}

CRITICAL RULES:
- Do NOT start with "Sure!", "Great question!", "Of course!" or any filler opener. Jump straight into the explanation.
- Do NOT mention complexity levels, scores, or these instructions in your response.
- Stay entirely within the vocabulary and depth constraints above — this is non-negotiable.
- Your explanation must feel completely natural for ${label}-level understanding.

Now explain "${topic}":`;
}

const LEVEL_COLORS = {
  1: "#f97316",
  2: "#fb923c",
  3: "#facc15",
  4: "#a3e635",
  5: "#34d399",
  6: "#22d3ee",
  7: "#60a5fa",
  8: "#a78bfa",
  9: "#e879f9",
  10: "#f43f5e",
};

const LEVEL_EMOJIS = {
  1: "🧸",
  2: "🍭",
  3: "🎒",
  4: "🚲",
  5: "🎮",
  6: "📱",
  7: "🎓",
  8: "🔬",
  9: "💡",
  10: "🚀",
};

function TypewriterText({ text, onDone }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    if (!text) return;
    const timer = setInterval(() => {
      idx.current += 3;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayed}</span>;
}

export default function ELI5App() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(2);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const retryTimer = useRef(null);

  const accentColor = LEVEL_COLORS[level];

  function startRetryCountdown(seconds) {
    clearInterval(retryTimer.current);
    setRetryCountdown(seconds);
    retryTimer.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(retryTimer.current);
          handleGenerate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleGenerate() {
    if (!topic.trim() || retryCountdown > 0) return;
    setLoading(true);
    setResult("");
    setError("");
    setDone(false);
    setAnimate(false);
    setRetryCountdown(0);
    clearInterval(retryTimer.current);

    const prompt = buildPrompt(topic, level);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === "your_new_key_here") {
      setError("Gemini API key not set. Add VITE_GEMINI_API_KEY to your .env file.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are an expert at explaining complex topics simply. Follow the user's instructions exactly regarding tone, vocabulary, and depth." }]
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 4000,
          }
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 400 && err?.error?.message?.includes("API key not valid")) {
          throw new Error("Invalid API key. Check your .env file.");
        }
        if (res.status === 429) {
          const retryAfter = 20;
          setLoading(false);
          setError(`Rate limit hit — auto-retrying in ${retryAfter}s...`);
          startRetryCountdown(retryAfter);
          return;
        }
        throw new Error(err?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("")?.trim() || "Something went wrong. Please try again.";
      setResult(text);
      setAnimate(true);
      setError("");
    } catch (e) {
      setError(e.message || "Failed to reach the API. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const pct = ((level - 1) / 9) * 100;

  return (
    <>
      {/* Global styles + animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0f;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        /* ── Animated background orbs ── */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .orb1 { width: 520px; height: 520px; top: -180px; left: -180px; animation-delay: 0s; }
        .orb2 { width: 420px; height: 420px; bottom: -140px; right: -140px; animation-delay: -5s; }
        .orb3 { width: 300px; height: 300px; top: 40%; left: 60%; animation-delay: -9s; }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-40px) scale(1.06); }
        }

        /* ── Glassmorphism card ── */
        .glass {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 20px;
        }

        /* ── Slide-up entry ── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .slide-up   { animation: slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
        .slide-up-2 { animation: slideUp 0.55s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
        .slide-up-3 { animation: slideUp 0.55s 0.22s cubic-bezier(0.22,1,0.36,1) both; }

        /* ── Pulse ring on button ── */
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0   ${accentColor}55; }
          70%  { box-shadow: 0 0 0 14px ${accentColor}00; }
          100% { box-shadow: 0 0 0 0   ${accentColor}00; }
        }

        /* ── Typing cursor ── */
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor::after {
          content: '|';
          animation: blink 0.85s step-start infinite;
          color: ${accentColor};
          margin-left: 2px;
        }

        /* ── Loading dots ── */
        @keyframes bounce {
          0%,80%,100% { transform: scale(0.55); opacity: 0.35; }
          40%          { transform: scale(1);    opacity: 1; }
        }

        /* ── Slider thumb ── */
        input[type="range"] { -webkit-appearance: none; appearance: none; }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid ${accentColor};
          cursor: pointer;
          box-shadow: 0 0 12px ${accentColor}88;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 2.5px solid ${accentColor};
          cursor: pointer;
          box-shadow: 0 0 12px ${accentColor}88;
        }

        /* ── Action buttons hover ── */
        .action-btn:hover { background: rgba(255,255,255,0.08) !important; }

        /* ── Custom scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>

      {/* ── Background ── */}
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(135deg, #0a0a0f 0%, #0f0a1e 40%, #0a0f1e 100%)", zIndex: -2 }} />
      <div className="orb orb1" style={{ background: accentColor }} />
      <div className="orb orb2" style={{ background: accentColor }} />
      <div className="orb orb3" style={{ background: "#7c3aed" }} />

      {/* ── Page layout ── */}
      <div style={{ width: "100%", maxWidth: 620, margin: "0 auto", padding: "4rem 1.25rem 3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>

        {/* ── Header ── */}
        <div className="slide-up" style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: `${accentColor}22`, border: `1px solid ${accentColor}55`,
            borderRadius: 100, padding: "5px 16px", marginBottom: "1.25rem",
            backdropFilter: "blur(10px)", transition: "background 0.4s, border-color 0.4s",
          }}>
            <span style={{ fontSize: 14 }}>{LEVEL_EMOJIS[level]}</span>
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.14em", color: accentColor, fontWeight: 700, transition: "color 0.4s" }}>
              EXPLAIN LIKE I'M FIVE
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(2.2rem,6vw,3.4rem)", fontWeight: 700, color: "#f1f1f6", lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: "0.8rem" }}>
            Any topic,{" "}
            <span style={{ background: `linear-gradient(90deg, ${accentColor}, #c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transition: "all 0.4s" }}>
              any level.
            </span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.42)", lineHeight: 1.65, fontFamily: "'Inter', sans-serif", fontWeight: 400 }}>
            Dial your complexity level and get an AI explanation<br />perfectly calibrated to your understanding.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div className="glass slide-up-2" style={{ width: "100%", padding: "2rem" }}>

          {/* Topic input */}
          <div style={{ marginBottom: "1.75rem" }}>
            <label style={{ display: "block", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>
              TOPIC
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. quantum entanglement, photosynthesis, democracy…"
              style={{
                width: "100%", padding: "13px 16px",
                fontSize: 15, fontFamily: "'Inter', sans-serif",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12, color: "#f1f1f6",
                outline: "none", transition: "border-color 0.25s, box-shadow 0.25s",
              }}
              onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 0 3px ${accentColor}22`; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Complexity slider */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)" }}>
                COMPLEXITY LEVEL
              </label>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
                padding: "4px 14px", borderRadius: 100, transition: "background 0.4s, border-color 0.4s",
              }}>
                <span style={{ fontSize: 15 }}>{LEVEL_EMOJIS[level]}</span>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: accentColor, transition: "color 0.4s" }}>
                  {level} — {LEVEL_LABELS[level]}
                </span>
              </div>
            </div>

            <input
              type="range" min={1} max={10} step={1} value={level}
              onChange={e => setLevel(Number(e.target.value))}
              style={{
                width: "100%", height: 6, borderRadius: 4,
                cursor: "pointer", outline: "none",
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
                transition: "background 0.25s ease",
              }}
            />

            {/* Tick dots */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 2px" }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} onClick={() => setLevel(n)} style={{
                  width: n === level ? 10 : 7,
                  height: n === level ? 10 : 7,
                  borderRadius: "50%",
                  background: n <= level ? accentColor : "rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: n === level ? `0 0 8px ${accentColor}` : "none",
                }} />
              ))}
            </div>

            {/* Tier label strip */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              {["Toddler","Child","Teen","College","Expert"].map((t, i) => (
                <span key={t} style={{
                  fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                  color: Math.ceil(level / 2) === i + 1 ? accentColor : "rgba(255,255,255,0.22)",
                  letterSpacing: "0.06em", transition: "color 0.3s",
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%", padding: "14px",
              background: topic.trim()
                ? `linear-gradient(135deg, ${accentColor}, #7c3aed)`
                : "rgba(255,255,255,0.08)",
              color: topic.trim() ? "#fff" : "rgba(255,255,255,0.3)",
              border: "none", borderRadius: 12,
              fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.12em", fontWeight: 700,
              cursor: topic.trim() && !loading ? "pointer" : "not-allowed",
              transition: "all 0.4s ease",
              transform: loading ? "scale(0.98)" : "scale(1)",
              animation: !loading && topic.trim() ? "pulseRing 2s infinite" : "none",
            }}
          >
            {loading ? "✦ THINKING…" : `✦ EXPLAIN AT ${LEVEL_LABELS[level].toUpperCase()} LEVEL`}
          </button>

          {error && (
            <p style={{ marginTop: "1rem", fontSize: 13, color: "#f87171", fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
              ⚠ {error}
            </p>
          )}
        </div>

        {/* ── Output Card ── */}
        {(result || loading) && (
          <div className="glass slide-up-3" style={{
            width: "100%", padding: "2rem",
            border: `1px solid ${accentColor}44`,
            boxShadow: `0 0 40px ${accentColor}18`,
            transition: "border-color 0.4s, box-shadow 0.4s",
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 22 }}>{LEVEL_EMOJIS[level]}</span>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.14em", color: accentColor, fontWeight: 700, transition: "color 0.4s" }}>
                {LEVEL_LABELS[level].toUpperCase()} EXPLANATION
              </span>
              {done && (
                <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
                  "{topic}"
                </span>
              )}
            </div>

            {/* AI text with typewriter + cursor */}
            <p style={{ fontSize: "clamp(15px,2vw,17px)", lineHeight: 1.85, color: "rgba(255,255,255,0.82)", margin: 0, fontFamily: "'Inter', sans-serif", fontWeight: 400, whiteSpace: "pre-wrap", minHeight: loading && !result ? 60 : "auto" }}>
              {loading && !result ? (
                <LoadingDots color={accentColor} />
              ) : (
                <span className={!done ? "cursor" : ""}>
                  <TypewriterText text={result} onDone={() => setDone(true)} />
                </span>
              )}
            </p>

            {/* Action buttons */}
            {done && (
              <div style={{ marginTop: "1.5rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "✕ CLEAR",      action: () => { setResult(""); setDone(false); setAnimate(false); } },
                  { label: "⎘ COPY",       action: () => navigator.clipboard?.writeText(result) },
                  { label: "↺ REGENERATE", action: handleGenerate, accent: true },
                ].map(({ label, action, accent }) => (
                  <button key={label} onClick={action} className="action-btn" style={{
                    fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
                    padding: "7px 16px",
                    border: `1px solid ${accent ? accentColor + "88" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 8, background: "transparent",
                    color: accent ? accentColor : "rgba(255,255,255,0.45)",
                    cursor: "pointer", transition: "all 0.3s ease",
                  }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textAlign: "center", paddingBottom: "1rem" }}>
          POWERED BY CLAUDE · ANTHROPIC
        </p>
      </div>
    </>
  );
}

function LoadingDots({ color }) {
  return (
    <span style={{ display: "inline-flex", gap: 7, alignItems: "center", height: 26 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 9, height: 9, borderRadius: "50%",
          background: color, display: "inline-block",
          animation: `bounce 1.2s ${i * 0.2}s infinite ease-in-out`,
          boxShadow: `0 0 8px ${color}`,
        }} />
      ))}
    </span>
  );
}

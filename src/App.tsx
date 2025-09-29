import React, { useEffect, useMemo, useState } from "react";

// 쉬운 단계: 초성 1개 + 간단한 모음(ㅏ, ㅓ, ㅗ, ㅜ, ㅣ)만 사용
// 목표: 화면에 정답 음절(예: "가")을 크게 보여주고,
// 아이가 초성과 모음을 각각 고르면 정답 여부를 알려줌.
// 둘 다 맞추면 축하 애니메이션/피드백 + 다음 문제 버튼.

// 유니코드 한글 조합 공식
// https://en.wikipedia.org/wiki/Korean_language_and_computers#Hangul_in_Unicode
const BASE = 0xac00;
const CHOSEONG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];
const JUNGSEONG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ",
  "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
];

// 쉬운 단계에 사용할 초성/모음(쌍자음 제외, 단모음 5개)
const EASY_CHOSEONG = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"]; // 긴 목록이지만 모두 단순자음
const EASY_JUNGSEONG = ["ㅏ", "ㅓ", "ㅗ", "ㅜ", "ㅣ", "ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅡ"]; // 간단한 모음 + 추가

function composeHangul(choseong: string, jungseong: string) {
  const ci = CHOSEONG.indexOf(choseong);
  const ji = JUNGSEONG.indexOf(jungseong);
  if (ci < 0 || ji < 0) return "";
  const codePoint = BASE + ci * 588 + ji * 28; // 종성은 0 (없음)
  return String.fromCharCode(codePoint);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Round = {
  targetChoseong: string;
  targetJungseong: string;
  targetSyllable: string;
};

export default function App() {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [pickedChoseong, setPickedChoseong] = useState<string | null>(null);
  const [pickedJungseong, setPickedJungseong] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  function makeRound(): Round {
    const c = pickRandom(EASY_CHOSEONG);
    const v = pickRandom(EASY_JUNGSEONG);
    return {
      targetChoseong: c,
      targetJungseong: v,
      targetSyllable: composeHangul(c, v),
    };
  }

  function speak(text: string) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ko-KR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  function speakChar(ch: string) {
    speak(ch);
  }

  // 간단한 '타다!' 사운드 (WebAudio로 코드 생성)
  function playTada() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "triangle";
        o.frequency.value = freq;
        o.connect(g);
        g.connect(ctx.destination);
        const t0 = now + i * 0.05;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.2, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
        o.start(t0);
        o.stop(t0 + 0.4);
      });
    } catch {}
  }

  
  const choseongCorrect = pickedChoseong === round.targetChoseong;
  const jungseongCorrect = pickedJungseong === round.targetJungseong;
  const allCorrect = choseongCorrect && jungseongCorrect;

  useEffect(() => {
    if (allCorrect) {
      setShowConfetti(true);
      setStreak((s) => s + 1);
      playTada();
      const t = setTimeout(() => setShowConfetti(false), 2200);
      return () => clearTimeout(t);
    }
  }, [allCorrect]);

  function nextRound() {
    setRound(makeRound());
    setPickedChoseong(null);
    setPickedJungseong(null);
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-6 gap-6 bg-gradient-to-b from-white to-slate-100">
      <header className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">어린이 한글 퀴즈 — 쉬운 단계</h1>
        <div className="text-sm md:text-base opacity-70">연속 정답: <b>{streak}</b></div>
      </header>

      <main className="w-full max-w-3xl grid gap-6">
        <section className="flex flex-col items-center gap-3 p-6 rounded-2xl shadow bg-white">
          <div className="text-sm opacity-60">이 글자를 읽어봐요</div>
          <div className="text-7xl md:text-8xl font-extrabold tracking-tight select-none">
            {round.targetSyllable}
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              className="px-4 py-2 rounded-xl shadow text-sm hover:scale-105 transition"
              onClick={() => speak(round.targetSyllable)}
              aria-label="소리 듣기"
            >
              🔊 소리 듣기
            </button>
            <button
              className="px-4 py-2 rounded-xl shadow text-sm hover:scale-105 transition"
              onClick={() => nextRound()}
            >
              🔁 새 문제
            </button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="text-lg font-semibold">1) 초성(자음)을 골라요</div>
          <div className="grid grid-cols-7 sm:grid-cols-7 gap-2">
            {EASY_CHOSEONG.map((c) => {
              const isPicked = pickedChoseong === c;
              const isCorrect = c === round.targetChoseong;
              const state = isPicked ? (isCorrect ? "correct" : "wrong") : "idle";
              return (
                <ChoiceKey
                  key={c}
                  label={c}
                  size="lg"
                  state={state}
                  onClick={() => setPickedChoseong(c)}
                  onSpeak={() => speakChar(c)}
                />
              );
            })}
          </div>
        </section>

        <section className="grid gap-4">
          <div className="text-lg font-semibold">2) 모음을 골라요</div>
          <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
            {EASY_JUNGSEONG.map((v) => {
              const isPicked = pickedJungseong === v;
              const isCorrect = v === round.targetJungseong;
              const state = isPicked ? (isCorrect ? "correct" : "wrong") : "idle";
              return (
                <ChoiceKey
                  key={v}
                  label={v}
                  size="lg"
                  state={state}
                  onClick={() => setPickedJungseong(v)}
                  onSpeak={() => speakChar(v)}
                />
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white shadow">
          <div className="text-base">
            {allCorrect ? (
              <span>정답이에요! 🥳 다음 문제로 가볼까요?</span>
            ) : (
              <span>초성과 모음을 차례대로 골라 보세요.</span>
            )}
          </div>
          <button
            className={`px-5 py-3 rounded-xl text-base font-semibold shadow transition ${
              allCorrect
                ? "bg-emerald-500 text-white hover:scale-105"
                : "bg-slate-200 text-slate-700 opacity-70"
            }`}
            onClick={nextRound}
          >
            다음 문제 ▶
          </button>
        </section>
      </main>

      {showConfetti && <ConfettiParticles seed={streak} />}
      {allCorrect && <OiiaCat />}

      <footer className="mt-6 text-xs opacity-60">
        쉬운 단계: 종성 없이 초성 + 모음(ㅏ, ㅓ, ㅗ, ㅜ, ㅣ, ㅑ, ㅕ, ㅛ, ㅠ, ㅡ)
      </footer>
    </div>
  );
}

function ChoiceKey({
  label,
  onClick,
  onSpeak,
  size = "md",
  state = "idle",
}: {
  label: string;
  onClick: () => void;
  onSpeak?: () => void;
  size?: "sm" | "md" | "lg";
  state?: "idle" | "correct" | "wrong";
}) {
  const sizeClass =
    size === "lg" ? "text-3xl py-4" : size === "md" ? "text-2xl py-3" : "text-xl py-2";
  const palette =
    state === "correct"
      ? "bg-emerald-500 text-white"
      : state === "wrong"
      ? "bg-rose-500 text-white"
      : "bg-white text-slate-900";
  return (
    <div className={`relative flex items-center`}>
      <button
        className={`rounded-2xl shadow px-4 ${sizeClass} font-bold tracking-tight select-none transition active:scale-95 ${palette}`}
        onClick={onClick}
      >
        {label}
      </button>
      {onSpeak && (
        <button
          aria-label={`${label} 소리 듣기`}
          className="ml-2 rounded-full shadow px-2 py-2 text-base bg-slate-200 hover:scale-105 active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onSpeak();
          }}
        >
          🔊
        </button>
      )}
    </div>
  );
}

function ConfettiParticles({ seed = 0, count = 120 }: { seed?: number; count?: number }) {
  // seed가 바뀌면 새로운 파티클 세트 생성
  const [items, setItems] = React.useState<
    { id: number; left: number; delay: number; duration: number; size: number; rotate: number; }[]
  >([]);

  React.useEffect(() => {
    const rand = (a:number,b:number)=> a + Math.random()*(b-a);
    const arr = Array.from({length: count}).map((_,i)=>({
      id: i,
      left: rand(0, 100),        // % 위치
      delay: rand(0, 0.8),       // 시작 지연
      duration: rand(1.8, 3.2),  // 낙하 시간
      size: rand(6, 12),         // 가로 크기(px)
      rotate: rand(-180, 180),   // 초기 회전
    }));
    setItems(arr);
  }, [seed, count]);

  // 전역 키프레임 1회 주입
  React.useEffect(() => {
    if (document.getElementById('confetti-particles-style')) return;
    const s = document.createElement('style');
    s.id = 'confetti-particles-style';
    s.textContent = `
      @keyframes confetti-fall {
        from { transform: translate3d(0,-110vh,0) rotate(0deg); }
        to   { transform: translate3d(0,110vh,0) rotate(360deg); }
      }
    `;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{position:'fixed', inset:0 as any, pointerEvents:'none', overflow:'hidden', zIndex: 9999}}>
      {items.map(p => (
        <div key={p.id}
          style={{
            position:'absolute',
            top: '-10vh',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,                           // 직사각형
            background: `hsl(${(p.left*3.6)%360} 85% 60%)`, // 다양한 색
            opacity: 0.9,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
            boxShadow: '0 0 0.5px rgba(0,0,0,.2)'
          }}
        />
      ))}
    </div>
  );
}

    
// Tailwind 없는 환경 대비: 최소 스타일(미리보기용)
const style = document.createElement('style');
style.innerHTML = `
  .animate-ping-slow { animation: ping-slow 1.2s ease-out; }
  @keyframes ping-slow { 0% { transform: scale(0.9); opacity: .7 } 80% { transform: scale(1.05); opacity: .4 } 100% { transform: scale(1); opacity: 0 } }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

function OiiaCat() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
      <video
        src="https://i.namu.wiki/i/5Co-QUdsrtknZ3kMpYvUbfFTi9H9NaRZ0nhDD0Px1SFcdagIKUWSBToyDfU7hZSHhAONFzoKBOZZFVj8LeAF0g.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ maxWidth: '60vw', maxHeight: '60vh', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}
      />
    </div>
  );
}

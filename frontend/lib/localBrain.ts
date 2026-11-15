export type LocalGameDesign = {
  template: "coin_collector" | "dodge";
  title: string;
  description: string;
  objective: string;
  difficulty: string;
  theme: string;
  generation_mode: "local_brain";
  note: string;
};

const memoryKey = "veltrix-local-brain-memory";

function readMemory(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(-20) : [];
  } catch {
    return [];
  }
}

/** A small offline rule-based brain. It runs entirely in the user's browser. */
export function thinkLocally(prompt: string): LocalGameDesign {
  const text = prompt.toLocaleLowerCase();
  const persian = /[\u0600-\u06ff]/.test(prompt);
  const wantsDodge = /dodge|avoid|escape|obstacle|enemy|دشمن|فرار|جا.?خالی|مانع|اجتناب/.test(text);
  const template = wantsDodge ? "dodge" : "coin_collector";
  const difficulty = /hard|difficult|سخت|دشوار/.test(text) ? (persian ? "سخت" : "Hard")
    : /easy|simple|آسان|ساده/.test(text) ? (persian ? "آسان" : "Easy")
    : (persian ? "متوسط" : "Normal");
  const theme = /space|planet|فضا|سیاره|کهکشان/.test(text) ? (persian ? "فضایی" : "Space")
    : /forest|jungle|جنگل|طبیعت/.test(text) ? (persian ? "جنگلی" : "Forest")
    : /cyber|robot|ربات|سایبر/.test(text) ? (persian ? "سایبر" : "Cyber")
    : (persian ? "فانتزی" : "Fantasy");

  const design: LocalGameDesign = {
    template,
    title: wantsDodge ? (persian ? "فرار بزرگ" : "The Great Escape") : (persian ? "شکارچی سکه" : "Coin Quest"),
    description: wantsDodge
      ? (persian ? "یک بازی دوبعدی سرعتی؛ بازیکن باید از موانع و دشمنان دوری کند و زنده بماند." : "A fast 2D survival game. Move carefully, avoid obstacles and stay alive.")
      : (persian ? "یک ماجراجویی دوبعدی؛ بازیکن در محیط حرکت می‌کند و آیتم‌های درخشان را جمع‌آوری می‌کند." : "A 2D adventure. Explore the level, collect glowing items and build your score."),
    objective: wantsDodge
      ? (persian ? "تا جای ممکن زنده بمان و به موانع برخورد نکن." : "Survive as long as possible without hitting obstacles.")
      : (persian ? "همه سکه‌ها را جمع کن و بیشترین امتیاز را بگیر." : "Collect the coins and reach the highest score."),
    difficulty,
    theme,
    generation_mode: "local_brain",
    note: persian ? "این طرح با مغز محلی VELTRIX و بدون اینترنت یا API ساخته شد." : "Designed by the VELTRIX local brain — no internet or API required."
  };

  try {
    const history = readMemory();
    history.push(prompt.trim().slice(0, 240));
    localStorage.setItem(memoryKey, JSON.stringify(history.slice(-20)));
  } catch {
    // Private browsing or storage restrictions should not block local generation.
  }
  return design;
}

export function getLocalMemoryCount(): number {
  return readMemory().length;
}

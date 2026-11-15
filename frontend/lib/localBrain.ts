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

export type BrainProgress = { progress: number; text: string };

const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const memoryKey = "veltrix-local-brain-memory";
let enginePromise: Promise<any> | null = null;

function readMemory(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(memoryKey) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(-20) : [];
  } catch { return []; }
}

function remember(prompt: string) {
  try {
    const history = readMemory();
    history.push(prompt.trim().slice(0, 500));
    localStorage.setItem(memoryKey, JSON.stringify(history.slice(-30)));
  } catch { /* Storage restrictions must not block generation. */ }
}

/** Deterministic fallback for browsers without WebGPU. */
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
  remember(prompt);
  return {
    template,
    title: wantsDodge ? (persian ? "فرار بزرگ" : "The Great Escape") : (persian ? "شکارچی سکه" : "Coin Quest"),
    description: wantsDodge
      ? (persian ? "یک بازی دوبعدی سرعتی؛ بازیکن باید از موانع و دشمنان دوری کند و زنده بماند." : "A fast 2D survival game. Move carefully, avoid obstacles and stay alive.")
      : (persian ? "یک ماجراجویی دوبعدی؛ بازیکن در محیط حرکت می‌کند و آیتم‌های درخشان را جمع‌آوری می‌کند." : "A 2D adventure. Explore the level, collect glowing items and build your score."),
    objective: wantsDodge
      ? (persian ? "تا جای ممکن زنده بمان و به موانع برخورد نکن." : "Survive as long as possible without hitting obstacles.")
      : (persian ? "همه سکه‌ها را جمع کن و بیشترین امتیاز را بگیر." : "Collect the coins and reach the highest score."),
    difficulty, theme, generation_mode: "local_brain",
    note: persian ? "حالت پایه VELTRIX فعال شد؛ مدل زبانی روی این دستگاه در دسترس نبود."
      : "VELTRIX basic local mode is active; the language model was unavailable on this device."
  };
}

async function getEngine(onProgress?: (progress: BrainProgress) => void) {
  if (typeof window === "undefined" || !("gpu" in navigator)) {
    throw new Error("WebGPU is not available in this browser.");
  }
  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm").then(({ CreateMLCEngine }) =>
      CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => onProgress?.({
          progress: Math.round(report.progress * 100),
          text: report.text || "Loading local model..."
        })
      })
    ).catch((error) => { enginePromise = null; throw error; });
  }
  return enginePromise;
}

/** Runs Qwen in-browser. Model weights are downloaded once and cached by the browser. */
export async function thinkWithModel(
  prompt: string,
  onProgress?: (progress: BrainProgress) => void
): Promise<LocalGameDesign> {
  const engine = await getEngine(onProgress);
  onProgress?.({ progress: 100, text: "Thinking on this device..." });
  const history = readMemory().slice(-6);
  const response = await engine.chat.completions.create({
    messages: [
      { role: "system", content: [
        "You are VELTRIX, an expert 2D game designer.",
        "Understand the user's request in Persian or English.",
        "Return only a valid JSON object with these fields: template (coin_collector or dodge), title, description, objective, difficulty, theme.",
        "Keep all natural-language fields in the same language as the user.",
        "Design a playable 2D starter game. Choose dodge for survival or avoidance games; otherwise coin_collector.",
        "Do not include markdown fences or extra keys."
      ].join(" ") },
      ...(history.length ? [{ role: "assistant" as const, content: "Recent project prompts: " + history.join(" | ") }] : []),
      { role: "user", content: prompt.trim().slice(0, 2000) }
    ],
    temperature: 0.7,
    max_tokens: 350,
    response_format: { type: "json_object" }
  });
  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw !== "string") throw new Error("The local model returned an empty response.");
  const parsed = JSON.parse(raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, "").trim());
  const persian = /[\u0600-\u06ff]/.test(prompt);
  const design: LocalGameDesign = {
    template: parsed.template === "dodge" ? "dodge" : "coin_collector",
    title: typeof parsed.title === "string" ? parsed.title.slice(0, 90) : (persian ? "بازی جدید" : "New Game"),
    description: typeof parsed.description === "string" ? parsed.description.slice(0, 500) : "",
    objective: typeof parsed.objective === "string" ? parsed.objective.slice(0, 300) : "",
    difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty.slice(0, 40) : (persian ? "متوسط" : "Normal"),
    theme: typeof parsed.theme === "string" ? parsed.theme.slice(0, 60) : (persian ? "فانتزی" : "Fantasy"),
    generation_mode: "local_brain",
    note: persian ? "این طرح با مدل زبانی محلی روی دستگاه شما تولید شد؛ درخواست به API ارسال نشد."
      : "Designed by the on-device language model. Your prompt was not sent to an AI API."
  };
  remember(prompt);
  return design;
}

export function getLocalMemoryCount(): number {
  return typeof window === "undefined" ? 0 : readMemory().length;
}

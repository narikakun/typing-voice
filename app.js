const input = document.querySelector("#message");
const status = document.querySelector("#status");

const synth = window.speechSynthesis;
const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

let previousValue = "";
let pendingText = "";
let timerId;
let isComposing = false;
let japaneseVoice;

function findJapaneseVoice() {
  if (!canSpeak) return;

  const voices = synth.getVoices();
  japaneseVoice =
    voices.find((voice) => voice.lang.toLowerCase() === "ja-jp") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ja"));
}

function speakPending() {
  window.clearTimeout(timerId);

  const text = pendingText.replace(/\s+/g, " ").trim();
  pendingText = "";

  const hasSpeakableText = /[^\s。！？!?、,.]/.test(text);
  if (!hasSpeakableText || !canSpeak) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 1.05;
  utterance.pitch = 1;

  if (japaneseVoice) utterance.voice = japaneseVoice;

  utterance.addEventListener("start", () => {
    status.textContent = `読み上げ中: ${text}`;
  });
  utterance.addEventListener("end", () => {
    status.textContent = "";
  });
  utterance.addEventListener("error", () => {
    status.textContent = "読み上げられませんでした";
  });

  synth.speak(utterance);
}

function scheduleSpeech(text) {
  pendingText += text;
  window.clearTimeout(timerId);

  const endsPhrase = /[。！？!?、,\n]$/.test(text);
  timerId = window.setTimeout(speakPending, endsPhrase ? 80 : 420);
}

function insertedPart(before, after) {
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > start &&
    afterEnd > start &&
    before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return after.slice(start, afterEnd);
}

function handleInput() {
  if (isComposing) return;

  const value = input.value;
  const addition = insertedPart(previousValue, value);
  previousValue = value;

  if (addition) scheduleSpeech(addition);
}

input.addEventListener("compositionstart", () => {
  isComposing = true;
});

input.addEventListener("compositionend", () => {
  isComposing = false;
  handleInput();
});

input.addEventListener("input", handleInput);

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !isComposing) speakPending();

  if (event.key === "Escape") {
    pendingText = "";
    window.clearTimeout(timerId);
    if (canSpeak) synth.cancel();
    status.textContent = "";
  }
});

if (canSpeak) {
  findJapaneseVoice();
  synth.addEventListener("voiceschanged", findJapaneseVoice);
} else {
  input.placeholder = "このブラウザは読み上げに対応していません";
}

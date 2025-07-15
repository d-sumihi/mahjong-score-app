const correctSound = new Audio("sound/correct.mp3");
const wrongSound = new Audio("sound/wrong.mp3");

let scoreTable = {};

async function loadScoreTable() {
  try {
    const response = await fetch("data/scoreTable.json");
    scoreTable = await response.json();
    updateScoreDisplay();
    displayQuestion();
  } catch (e) {
    console.error("点数データの読み込みに失敗しました:", e);
  }
}

const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const resultEl = document.getElementById("result");
const nextButton = document.getElementById("nextButton");
const scoreEl = document.getElementById("score");

let currentAnswer = null;
let currentScore = 0;

function updateScoreDisplay() {
  scoreEl.textContent = `スコア：${currentScore}`;
}

function calculateFixedPoint(han, role, winType, fu = null) {
  const h = parseInt(han);
  const f = parseInt(fu);

  if (f === 20 && h === 4) return null;

  if (h >= 13) {
    if (winType === "tsumo") {
      if (role === "parent") return "16000 ALL";
      else return "8000 / 16000";
    } else {
      if (role === "parent") return "48000";
      else return "32000";
    }
  }

  if (h >= 11) {
    if (winType === "tsumo") {
      if (role === "parent") return "12000 ALL";
      else return "6000 / 12000";
    } else {
      if (role === "parent") return "36000";
      else return "24000";
    }
  }

  if (h >= 8) {
    if (winType === "tsumo") {
      if (role === "parent") return "8000 ALL";
      else return "4000 / 8000";
    } else {
      if (role === "parent") return "24000";
      else return "16000";
    }
  }

  if (h >= 6) {
    if (winType === "tsumo") {
      if (role === "parent") return "6000 ALL";
      else return "3000 / 6000";
    } else {
      if (role === "parent") return "18000";
      else return "12000";
    }
  }

  if (h >= 4) {
    if (winType === "tsumo") {
      if (role === "parent") return "4000 ALL";
      else return "2000 / 4000";
    } else {
      if (role === "parent") return "12000";
      else return "8000";
    }
  }

  return null;
}

function formatAnswer(val, role, winType) {
  if (val === undefined || val === null) return null;

  if (role === "child" && winType === "tsumo") {
    if (val.child && val.parent) return `${val.child} / ${val.parent}`;
    return null;
  } else if (role === "parent" && winType === "tsumo") {
    if (typeof val === "number" || typeof val === "string") return `${val} ALL`;
    return null;
  } else {
    if (typeof val === "number" || typeof val === "string") return `${val}`;
    return null;
  }
}

function getRandomEntry() {
  const roles = ["parent", "child"];
  const role = roles[Math.floor(Math.random() * roles.length)];
  const winTypes = ["ron", "tsumo"];
  const winType = winTypes[Math.floor(Math.random() * winTypes.length)];
  const fuList = ["20", "30", "40", "50", "60"];
  const hanList = Array.from({ length: 13 }, (_, i) => (i + 1).toString());

  const fu = fuList[Math.floor(Math.random() * fuList.length)];
  const han = hanList[Math.floor(Math.random() * hanList.length)];

  const fixed = calculateFixedPoint(han, role, winType, fu);
  if (fixed !== null) {
    return { fu, han, answer: fixed, role, winType };
  }

  const key = `${fu}-${han}`;
  const data = scoreTable?.[role]?.[winType]?.[key];
  if (!data) return getRandomEntry();

  const answer = formatAnswer(data, role, winType);
  if (!answer) return getRandomEntry();

  return { fu, han, answer, role, winType };
}

function generateChoices(fu, han, role, correctAnswer, winType) {
  const fuList = ["20", "30", "40", "50", "60"];
  const hanInt = parseInt(han);
  const candidateSet = new Set();

  for (const otherFu of fuList) {
    if (otherFu !== fu) {
      const key = `${otherFu}-${han}`;
      const val = scoreTable?.[role]?.[winType]?.[key];
      const formatted = formatAnswer(val, role, winType);
      if (formatted) candidateSet.add(formatted);
    }
  }

  for (let delta of [-1, 1]) {
    const h = hanInt + delta;
    if (h >= 1 && h <= 13) {
      const fixed = calculateFixedPoint(h.toString(), role, winType, fu);
      if (fixed) candidateSet.add(fixed);
      else {
        const key = `${fu}-${h}`;
        const val = scoreTable?.[role]?.[winType]?.[key];
        const formatted = formatAnswer(val, role, winType);
        if (formatted) candidateSet.add(formatted);
      }
    }
  }

  const fixed = calculateFixedPoint(han, role, winType, fu);
  if (fixed && fixed !== correctAnswer) candidateSet.add(fixed);

  const candidates = Array.from(candidateSet).filter(v => v !== correctAnswer);

  if (candidates.length < 3) {
    const backupSet = new Set();
    for (let h = 1; h <= 13; h++) {
      for (const f of fuList) {
        const fixed = calculateFixedPoint(h.toString(), role, winType, f);
        if (fixed) backupSet.add(fixed);
        else {
          const key = `${f}-${h}`;
          const val = scoreTable?.[role]?.[winType]?.[key];
          const formatted = formatAnswer(val, role, winType);
          if (formatted) backupSet.add(formatted);
        }
      }
    }

    const backupList = Array.from(backupSet).filter(
      v => v !== correctAnswer && !candidates.includes(v)
    );

    while (candidates.length < 3 && backupList.length > 0) {
      const val = backupList.splice(Math.floor(Math.random() * backupList.length), 1)[0];
      candidates.push(val);
    }
  }

  const selected = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...selected, correctAnswer].sort(() => Math.random() - 0.5);
}

function displayQuestion() {
  resultEl.textContent = "";
  nextButton.style.display = "none";

  const { fu, han, answer, role, winType } = getRandomEntry();
  currentAnswer = answer;

  let roleJP = role === "parent" ? "親" : "子";
  let winJP = winType === "tsumo" ? "ツモあがり" : "ロンあがり";

  questionEl.innerHTML = `
    <p><strong>符：</strong>${fu}符</p>
    <p><strong>翻数：</strong>${han}翻</p>
    <p><strong>状況：</strong>${roleJP}・${winJP}</p>
    <p>点数は？</p>
  `;

  const choices = generateChoices(fu, han, role, answer, winType);
  choicesEl.innerHTML = "";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => {
      if (nextButton.style.display === "inline-block") return;
      document.querySelectorAll("#choices button").forEach(b => b.disabled = true);

      if (choice === currentAnswer) {
        correctSound.currentTime = 0;
        correctSound.play();
        resultEl.textContent = "✅ 正解！ +10点";
        resultEl.style.color = "green";
        currentScore += 10;
        updateScoreDisplay();
      } else {
        wrongSound.currentTime = 0;
        wrongSound.play();
        resultEl.textContent = `❌ 不正解！正解は ${currentAnswer}`;
        resultEl.style.color = "red";
      }

      nextButton.style.display = "inline-block";
    };
    choicesEl.appendChild(btn);
  });
}

nextButton.onclick = displayQuestion;
loadScoreTable();  // 初期化時に JSON を読み込む
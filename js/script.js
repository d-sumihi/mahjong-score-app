let score = 0;
let currentAnswer = "";
let currentMode = "normal";
let scoreData = {};

async function loadScoreData() {
  const response = await fetch("data/scoreTable.json");
  scoreData = await response.json();
}

function startQuiz(mode) {
  currentMode = mode;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-container").style.display = "flex";
  score = 0;
  updateScore();
  nextQuestion();
}

function updateScore() {
  document.getElementById("score").textContent = `スコア: ${score}`;
}

function nextQuestion() {
  document.getElementById("result").textContent = "";
  document.getElementById("next-button").style.display = "none";

  const types = ["ron", "tsumo"];
  const roles = ["child", "parent"];
  const type = types[Math.floor(Math.random() * types.length)];
  const role = roles[Math.floor(Math.random() * roles.length)];

  const pool = Object.keys(scoreData[role][type]);

  // フィルター（マンガン未満モード）
  const filtered = currentMode === "belowMangan"
    ? pool.filter(key => {
        const [fu, han] = key.split("-").map(Number);
        return (
          (fu === 20 && han <= 4) ||
          (fu === 30 && han <= 3) ||
          (fu === 40 && han <= 3) ||
          (fu === 50 && han <= 3)
        );
      })
    : pool;

  const key = filtered[Math.floor(Math.random() * filtered.length)];
  const [fu, han] = key.split("-").map(Number);

  document.getElementById("question").textContent = `${fu}符${han}翻・${role === "parent" ? "親" : "子"}の${type === "ron" ? "ロン" : "ツモ"}`;

  let answer, choices = [];

  if (type === "tsumo") {
    if (role === "child") {
      const tsumo = scoreData.child.tsumo[key];
      answer = `${tsumo.child}/${tsumo.parent}`;
      choices.push(answer);
      while (choices.length < 4) {
        const alt = scoreData.child.tsumo[randomKey(scoreData.child.tsumo)];
        const option = `${alt.child}/${alt.parent}`;
        if (!choices.includes(option)) choices.push(option);
      }
    } else {
      const val = scoreData.parent.tsumo[key];
      answer = `${val}`;
      choices.push(answer);
      while (choices.length < 4) {
        const alt = scoreData.parent.tsumo[randomKey(scoreData.parent.tsumo)];
        const option = `${alt}`;
        if (!choices.includes(option)) choices.push(option);
      }
    }
  } else {
    const val = scoreData[role].ron[key];
    answer = `${val}`;
    choices.push(answer);
    while (choices.length < 4) {
      const alt = scoreData[role].ron[randomKey(scoreData[role].ron)];
      const option = `${alt}`;
      if (!choices.includes(option)) choices.push(option);
    }
  }

  currentAnswer = answer;
  shuffleArray(choices);
  const choicesContainer = document.getElementById("choices");
  choicesContainer.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice);
    choicesContainer.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const result = document.getElementById("result");
  if (selected === currentAnswer) {
    result.textContent = "正解！";
    score += 10;
    updateScore();
  } else {
    result.textContent = `不正解… 正解は ${currentAnswer} です`;
  }
  document.getElementById("next-button").style.display = "block";
}

function randomKey(obj) {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

window.addEventListener("DOMContentLoaded", loadScoreData);

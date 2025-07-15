const correctSound = new Audio("sound/correct.mp3");
const wrongSound = new Audio("sound/wrong.mp3");

const questionElement = document.getElementById("question");
const choicesElement = document.getElementById("choices");
const resultElement = document.getElementById("result");
const scoreElement = document.getElementById("score");
const nextButton = document.getElementById("nextButton");
const muteToggle = document.getElementById("muteToggle");
const nonManganCheckbox = document.getElementById("nonManganMode");

let score = 0;
let correctAnswer = "";
let isMuted = false;
let currentMode = "child";
let currentMethod = "ron";

correctSound.volume = 0.5;
wrongSound.volume = 0.5;

muteToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  correctSound.muted = isMuted;
  wrongSound.muted = isMuted;
  muteToggle.textContent = isMuted ? "🔇 ミュート解除" : "🔊 ミュート";
});

function getValidKeys(scoreTable, mode, method, nonManganOnly) {
  const keys = Object.keys(scoreTable[mode][method]);
  if (!nonManganOnly) return keys;

  return keys.filter(key => {
    const [fu, han] = key.split("-").map(Number);
    if (fu === 20 && han <= 4) return true;
    if ((fu === 30 || fu === 40 || fu === 50) && han <= 3) return true;
    return false;
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function displayQuestion() {
  const response = await fetch("data/scoreTable.json");
  const scoreTable = await response.json();
  currentMode = Math.random() < 0.5 ? "child" : "parent";
  currentMethod = Math.random() < 0.5 ? "ron" : "tsumo";
  const nonManganOnly = nonManganCheckbox.checked;

  const validKeys = getValidKeys(scoreTable, currentMode, currentMethod, nonManganOnly);
  const randomKey = validKeys[Math.floor(Math.random() * validKeys.length)];
  const [fu, han] = randomKey.split("-").map(Number);
  const answer = scoreTable[currentMode][currentMethod][randomKey];

  questionElement.textContent = `${currentMode === "parent" ? "親" : "子"}・${currentMethod === "ron" ? "ロン" : "ツモ"}：${fu}符${han}翻`;

  let displayAnswer = "";
  if (currentMethod === "tsumo") {
    if (currentMode === "parent") {
      displayAnswer = `${answer}ALL`;
    } else {
      displayAnswer = `${answer.child}/${answer.parent}`;
    }
  } else {
    displayAnswer = answer.toString();
  }

  correctAnswer = displayAnswer;

  const allKeys = getValidKeys(scoreTable, currentMode, currentMethod, false);
  const otherKeys = allKeys.filter(k => k !== randomKey);
  shuffle(otherKeys);

  const choices = [displayAnswer];
  while (choices.length < 4 && otherKeys.length > 0) {
    const k = otherKeys.pop();
    const v = scoreTable[currentMode][currentMethod][k];
    let choice = "";

    if (currentMethod === "tsumo") {
      if (currentMode === "parent") {
        choice = `${v}ALL`;
      } else {
        choice = `${v.child}/${v.parent}`;
      }
    } else {
      choice = v.toString();
    }

    if (!choices.includes(choice)) {
      choices.push(choice);
    }
  }

  shuffle(choices);
  choicesElement.innerHTML = "";
  choices.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.onclick = () => {
      if (c === correctAnswer) {
        resultElement.textContent = "正解！";
        if (!isMuted) correctSound.play();
        score += 10;
      } else {
        resultElement.textContent = `不正解… 正解は ${correctAnswer}`;
        if (!isMuted) wrongSound.play();
      }
      scoreElement.textContent = `スコア: ${score}`;
      nextButton.disabled = false;
      Array.from(choicesElement.children).forEach(b => b.disabled = true);
    };
    choicesElement.appendChild(btn);
  });

  nextButton.disabled = true;
  resultElement.textContent = "";
}

nextButton.addEventListener("click", displayQuestion);
window.addEventListener("load", displayQuestion);

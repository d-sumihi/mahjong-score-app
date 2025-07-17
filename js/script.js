let score = 0;
let quizData = {};
let currentMode = false; // false: 通常モード, true: マンガン未満モード
let currentQuestion = null;

// JSON読み込み
fetch("data/scoreTable.json")
  .then(response => response.json())
  .then(data => {
    quizData = data;
  });

// スタート処理
function startGame(manganLessMode) {
  currentMode = manganLessMode;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-container").style.display = "flex";
  score = 0;
  updateScore();
  nextQuestion();
}

// スコア更新
function updateScore() {
  document.getElementById("score").textContent = `スコア: ${score}`;
}

// 問題作成
function nextQuestion() {
  document.getElementById("result").textContent = "";
  document.getElementById("next-button").style.display = "none";

  const dealer = Math.random() < 0.5 ? "parent" : "child";
  const winType = Math.random() < 0.5 ? "ron" : "tsumo";
  const table = quizData[dealer][winType];
  const keys = Object.keys(table);

  // 出題候補フィルタ（マンガン未満モード時）
  const filteredKeys = currentMode
    ? keys.filter(k => {
        const [fu, han] = k.split("-").map(Number);
        return (
          (fu === 20 && han <= 4) ||
          (fu === 30 && han <= 3) ||
          (fu === 40 && han <= 3) ||
          (fu === 50 && han <= 3)
        );
      })
    : keys;

  const selectedKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
  const [fu, han] = selectedKey.split("-").map(Number);
  const questionText = `${fu}符${han}翻・${dealer === "parent" ? "親" : "子"}の${winType === "ron" ? "ロン" : "ツモ"}`;

  let correctAnswer;
  if (winType === "ron") {
    correctAnswer = table[selectedKey];
  } else {
    const entry = table[selectedKey];
    if (dealer === "parent") {
      correctAnswer = `${entry}ALL`;
    } else {
      correctAnswer = `${entry.child}/${entry.parent}`;
    }
  }

  // 選択肢生成（undefinedを除外）
  const choices = [];
  const added = new Set();
  choices.push(correctAnswer);
  added.add(correctAnswer);

  while (choices.length < 4) {
    const randKey = filteredKeys[Math.floor(Math.random() * filteredKeys.length)];
    const alt = quizData[dealer][winType][randKey];

    let altText;
    if (winType === "ron") {
      altText = alt;
    } else {
      if (dealer === "parent") {
        altText = `${alt}ALL`;
      } else {
        altText = `${alt.child}/${alt.parent}`;
      }
    }

    if (altText && !added.has(altText)) {
      choices.push(altText);
      added.add(altText);
    }
  }

  shuffleArray(choices);

  // 表示
  document.getElementById("question").textContent = questionText;
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => {
      if (choice === correctAnswer) {
        document.getElementById("result").textContent = "正解！";
        score += 10;
        updateScore();
      } else {
        document.getElementById("result").textContent = `不正解… 正解は ${correctAnswer} です`;
      }
      document.getElementById("next-button").style.display = "block";
    };
    choicesDiv.appendChild(btn);
  });

  currentQuestion = {
    correctAnswer,
    dealer,
    winType,
    fu,
    han
  };
}

// シャッフル関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

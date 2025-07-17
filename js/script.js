let currentQuestion = {};
let score = 0;
let manganlessMode = false;

function startGame(isManganless) {
  manganlessMode = isManganless;
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  score = 0;
  document.getElementById("score").textContent = "スコア: 0";
  nextQuestion();
}

function nextQuestion() {
  document.getElementById("result").textContent = "";
  document.getElementById("next-button").style.display = "none";

  const fuOptions = [20, 30, 40, 50];
  const hanOptions = [1, 2, 3, 4];
  let fu, han;

  do {
    fu = fuOptions[Math.floor(Math.random() * fuOptions.length)];
    han = hanOptions[Math.floor(Math.random() * hanOptions.length)];
  } while (
    manganlessMode &&
    !(
      (fu === 20 && han <= 4) ||
      (fu >= 30 && han <= 3)
    )
  );

  const isParent = Math.random() < 0.5;
  const isTsumo = Math.random() < 0.5;
  const role = isParent ? "親" : "子";
  const method = isTsumo ? "ツモ" : "ロン";
  currentQuestion = { fu, han, isParent, isTsumo };

  document.getElementById("question").textContent = `${fu}符${han}翻・${role}の${method}`;

  fetch("data/scoreTable.json")
    .then((response) => response.json())
    .then((data) => {
      const roleKey = isParent ? "parent" : "child";
      const methodKey = isTsumo ? "tsumo" : "ron";
      const key = `${fu}-${han}`;
      let correct;

      if (isTsumo) {
        const val = data[roleKey][methodKey][key];
        correct = isParent
          ? `${val}ALL`
          : `${val.child}/${val.parent}`;
      } else {
        correct = data[roleKey][methodKey][key];
      }

      currentQuestion.answer = isTsumo && !isParent ? `${correct}` : `${correct}`;

      generateChoices(data);
    });
}

function generateChoices(data) {
  const { fu, han, isParent, isTsumo, answer } = currentQuestion;
  const roleKey = isParent ? "parent" : "child";
  const methodKey = isTsumo ? "tsumo" : "ron";

  const choiceSet = new Set();
  choiceSet.add(answer);

  const allKeys = Object.keys(data[roleKey][methodKey]);
  while (choiceSet.size < 4) {
    const randKey = allKeys[Math.floor(Math.random() * allKeys.length)];
    if (randKey === `${fu}-${han}`) continue;

    let val = data[roleKey][methodKey][randKey];
    let formatted;

    if (isTsumo) {
      formatted = isParent ? `${val}ALL` : `${val.child}/${val.parent}`;
    } else {
      formatted = `${val}`;
    }

    choiceSet.add(formatted);
  }

  const choicesArray = Array.from(choiceSet).sort(() => Math.random() - 0.5);
  const choiceContainer = document.getElementById("choices");
  choiceContainer.innerHTML = "";

  choicesArray.forEach((choice) => {
    const btn = document.createElement("button");
    btn.textContent = choice;
    btn.onclick = () => checkAnswer(choice);
    choiceContainer.appendChild(btn);
  });
}

function checkAnswer(selected) {
  const result = document.getElementById("result");
  const nextBtn = document.getElementById("next-button");

  if (selected === currentQuestion.answer) {
    result.textContent = "正解！";
    score += 10;
  } else {
    result.textContent = `不正解... 正解は ${currentQuestion.answer} です`;
  }

  document.getElementById("score").textContent = `スコア: ${score}`;
  nextBtn.style.display = "inline-block";

  // 全ボタンを無効化
  Array.from(document.getElementById("choices").children).forEach(btn => {
    btn.disabled = true;
  });
}
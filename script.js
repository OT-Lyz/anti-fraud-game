let trustScore = 5;
let round = 0;

document.getElementById("start-button").addEventListener("click", async () => {
  document.getElementById("start-button").style.display = "none";
  document.getElementById("game-output").innerText = "游戏开始，正在生成对话...";
  nextRound(null);
});

async function nextRound(choice) {
  if (choice) {
    // 信任度更新逻辑
    if (choice === "A") trustScore += 2;
    if (choice === "B") trustScore += 0;
    if (choice === "C") trustScore -= 2;
  }

  const prompt = generatePrompt(trustScore, round);

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "请生成当前回合的对话及ABC选项。" }
      ]
    })
  });

  const data = await response.json();
  const msg = data.choices?.[0]?.message?.content || "出错了，请重试。";
  const output = document.getElementById("game-output");
  output.innerText = msg;

  renderOptions();
  round++;
}

function renderOptions() {
  const container = document.createElement("div");
  ["A", "B", "C"].forEach(label => {
    const btn = document.createElement("button");
    btn.innerText = `选项${label}`;
    btn.onclick = () => nextRound(label);
    container.appendChild(btn);
  });
  const output = document.getElementById("game-output");
  output.appendChild(document.createElement("hr"));
  output.appendChild(container);
}

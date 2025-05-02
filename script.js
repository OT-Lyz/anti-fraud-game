let trustScore = 5;
let roundCount = 0;
const MAX_ROUNDS = 6;
let chatHistory = [];

document.getElementById("start-btn").addEventListener("click", async () => {
  document.getElementById("start-btn").style.display = "none";
  document.getElementById("dialogue-box").innerText = "正在加载对话...";
  document.getElementById("options").innerHTML = "";

  trustScore = 5;
  roundCount = 0;
  chatHistory = [{ role: "system", content: getHRPrompt(trustScore) }];

  await nextRound();
});

async function nextRound(selectedLabel = null) {
  if (selectedLabel === "信任") trustScore += 3;
  else if (selectedLabel === "犹豫") trustScore += 1;
  else if (selectedLabel === "警觉") trustScore -= 2;

  if (trustScore >= 10 || trustScore <= 0 || roundCount >= MAX_ROUNDS) {
    return endGame();
  }

  roundCount++;

  const outputBox = document.getElementById("dialogue-box");
  const optionsDiv = document.getElementById("options");
  outputBox.innerText = "";
  optionsDiv.innerHTML = "";

  // 插入托儿发言（第2、4轮）
  if (roundCount === 2 || roundCount === 4) {
    try {
      const decoyRes = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: decoyPrompt },
            { role: "user", content: "请说一句配合HR引导玩家信任的话。" }
          ],
          temperature: 0.7
        })
      });

      const decoyData = await decoyRes.json();
      const decoyText = decoyData.choices?.[0]?.message?.content || "(托儿沉默)";
      outputBox.innerText += `[其他求职者] ${decoyText}\n\n`;
    } catch (err) {
      outputBox.innerText += "[托儿加载失败]\n\n";
    }
  }

  // 请求HR对话
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: getHRPrompt(trustScore) },
          { role: "user", content: "请继续诱导玩家，并提供三种自然选项。" }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(HR沉默)";

    const match = reply.match(/^(.*?)\nA\.\s*(.*?)\nB\.\s*(.*?)\nC\.\s*(.*)/s);
    if (!match) {
      outputBox.innerText += "[HR输出格式错误]";
      return;
    }

    const [_, intro, optA, optB, optC] = match;
    outputBox.innerText += `[HR] ${intro.trim()}`;

    const options = [optA, optB, optC];
    const labels = ["信任", "犹豫", "警觉"];

    options.forEach((text, idx) => {
      const btn = document.createElement("button");
      btn.innerText = `选项${"ABC"[idx]}：${text.trim()}`;
      btn.onclick = () => nextRound(labels[idx]);
      optionsDiv.appendChild(btn);
    });

  } catch (err) {
    outputBox.innerText = "系统错误：" + err.message;
  }
}

function endGame() {
  const result = trustScore >= 10
    ? "你完全信任了HR，并点击了缴费链接。你被骗了！"
    : trustScore <= 0
    ? "你察觉了异样，拒绝了HR的进一步要求。逃过一劫！"
    : "游戏结束，欢迎再次体验。";

  document.getElementById("dialogue-box").innerText = result;
  document.getElementById("options").innerHTML = "";
  document.getElementById("start-btn").style.display = "block";
}

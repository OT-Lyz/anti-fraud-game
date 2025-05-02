let trustScore = 5;
let roundCount = 0;
const MAX_ROUNDS = 6;
let chatHistory = []; // 每个玩家启动游戏时初始化

document.getElementById("start-btn").addEventListener("click", async () => {
  document.getElementById("start-btn").style.display = "none";
  document.getElementById("dialogue-box").innerText = "正在加载对话...";
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
  outputBox.innerText = "";

  // 插入托儿（第2、4轮）
  if (roundCount === 2 || roundCount === 4) {
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
            { role: "system", content: decoyPrompt },
            { role: "user", content: "请说一句配合HR引导玩家信任的话。" }
          ],
          temperature: 0.7
        })
      });
      const data = await res.json();
      const decoyText = data.choices?.[0]?.message?.content || "（托儿保持沉默）";
      outputBox.innerText += `[其他求职者] ${decoyText}\n\n`;
    } catch (err) {
      outputBox.innerText += "[托儿加载失败]";
    }
  }

  // 生成 HR 发言和选项
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
    const reply = data.choices?.[0]?.message?.content || "(HR保持沉默)";
    const [line, ...optionLines] = reply.split(/\nA\.|\nB\.|\nC\./);

    outputBox.innerText += `[HR] ${line.trim()}`;
    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";

    const labels = ["信任", "犹豫", "警觉"];
    ["A", "B", "C"].forEach((label, idx) => {
      const content = reply.match(new RegExp(`${label}\\.\\s*(.*?)\\n?`, "s"))?.[1]?.trim();
      if (content) {
        const btn = document.createElement("button");
        btn.innerText = `${label}. ${content}`;
        btn.onclick = () => nextRound(labels[idx]);
        optionsDiv.appendChild(btn);
      }
    });

  } catch (err) {
    outputBox.innerText = "系统错误：" + err.message;
  }
}

function endGame() {
  const endText = trustScore >= 10
    ? "你完全信任了HR，并点击了缴费链接。你被骗了！"
    : trustScore <= 0
    ? "你察觉了异样，拒绝了HR的进一步要求。逃过一劫！"
    : "游戏结束，欢迎再次体验。";
  document.getElementById("dialogue-box").innerText = endText;
  document.getElementById("options").innerHTML = "";
  document.getElementById("start-btn").style.display = "block";
}

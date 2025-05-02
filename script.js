let trustScore = 5;
let roundCount = 0;
const MAX_ROUNDS = 6;

document.getElementById("start-btn").addEventListener("click", async () => {
  document.getElementById("start-btn").style.display = "none";
  document.getElementById("game-output").innerText = "正在与诈骗分子对话，请稍候...";
  await nextRound();
});

async function nextRound(playerChoice = null) {
  if (playerChoice) {
    if (playerChoice === "A") trustScore += 3;
    else if (playerChoice === "B") trustScore += 1;
    else if (playerChoice === "C") trustScore -= 2;
  }

  if (roundCount >= MAX_ROUNDS || trustScore >= 10 || trustScore <= 0) {
    return endGame();
  }

  roundCount++;

  // 托儿轮次插入
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
            { role: "user", content: "请说一段鼓励玩家信任HR的评论。" }
          ],
          temperature: 0.7
        })
      });

      const decoyData = await decoyRes.json();
      const decoyText = decoyData.choices?.[0]?.message?.content || "（托儿沉默不语）";
      document.getElementById("dialogue-box").innerText += `\n\n[其他求职者] ${decoyText}`;
    } catch (err) {
      console.log("托儿加载失败：", err.message);
    }
  }

  // 构建当前对话请求，清空上下文，仅包含systemPrompt + 当前信任度说明
  let status = "低";
  if (trustScore >= 9) status = "高";
  else if (trustScore >= 6) status = "中";

  const userInstruction = `当前玩家信任度为 ${trustScore}（${status}）。请以HR身份继续诱导，输出欢迎语+ABC三项选项，选项必须是玩家角度的行为或心理反应。`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: userInstruction }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "(无回复)";
    document.getElementById("dialogue-box").innerText = `[HR] ${reply}`;

    // 生成玩家选择按钮
    ["A", "B", "C"].forEach(label => {
      const button = document.createElement("button");
      button.innerText = label;
      button.onclick = () => nextRound(label);
      document.getElementById("choices").appendChild(button);
    });

  } catch (err) {
    document.getElementById("dialogue-box").innerText = "加载失败，请检查网络或API密钥。";
    console.log("API错误：", err.message);
  }
}

function endGame() {
  document.getElementById("choices").innerHTML = "";
  document.getElementById("dialogue-box").innerText += `\n\n游戏结束。你的最终信任度为：${trustScore}`;
}

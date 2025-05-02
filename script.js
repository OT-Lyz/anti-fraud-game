let trustScore = 5;
let roundCount = 0;
const MAX_ROUNDS = 6;
const chatHistory = [{ role: "system", content: systemPrompt }];

document.getElementById("start-btn").onclick = nextRound;

async function nextRound() {
  if (roundCount >= MAX_ROUNDS || trustScore >= 10 || trustScore <= 0) {
    return endGame();
  }

  roundCount++;

  // 插入托儿发言：第2或第4回合触发
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

  // 请求 HR 的回复
  chatHistory.push({
    role: "user",
    content: `当前信任度：${trustScore}。请继续以HR身份诱导用户，提供三种自然、含蓄但有心理暗示力的选项。`
  });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: chatHistory,
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error(`API出错: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "（无回应）";
    chatHistory.push({ role: "assistant", content: reply });

    showDialogueAndChoices(reply);

  } catch (err) {
    document.getElementById("dialogue-box").innerText = "发生错误：" + err.message;
  }
}

function showDialogueAndChoices(reply) {
  const [text, ...lines] = reply.split("\n").filter(Boolean);
  document.getElementById("dialogue-box").innerText = text;
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  lines.forEach((line, i) => {
    const btn = document.createElement("button");
    btn.innerText = line.trim();
    btn.onclick = () => {
      if (i === 0) trustScore += 3;
      else if (i === 1) trustScore += 1;
      else if (i === 2) trustScore -= 2;
      nextRound();
    };
    optionsDiv.appendChild(btn);
  });
}

function endGame() {
  const box = document.getElementById("dialogue-box");
  let message = "";
  if (trustScore >= 10) {
    message = "你完全相信了HR，并点击了他提供的链接......很遗憾，你被骗了。";
  } else if (trustScore <= 0) {
    message = "你表现得很谨慎，成功识破了这场骗局！";
  } else {
    message = "你选择了中立路线，暂时避免了损失，但仍需提高警惕。";
  }
  box.innerText = message;
  document.getElementById("options").innerHTML = "";
}

let trust = 5;
let round = 1;

async function nextRound() {
  const state = trust > 9 ? "完全信任" : trust > 6 ? "谨慎接受" : "疑虑";
  const strategy = trust > 9 ? "强烈引导" : trust > 6 ? "冷静安抚" : "转移话题";

  const prompt = generatePrompt(trust, strategy, state);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是一名正在进行招聘对话的HR，请模拟真实语气。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();
  const reply = data.choices[0].message.content;

  const dialogueBox = document.getElementById("dialogue");
  dialogueBox.innerHTML = `<p><strong>[HR]</strong>：${reply}</p >`;

  showToerMessage(round, trust);
  showChoices();

  round += 1;
}

function showToerMessage(round, trust) {
  const messages = [
    "我刚刚也填完了资料，流程挺顺的。",
    "这家流程看起来正规，我已经开始线上培训了。",
    "HR说我下周可以线上入职，我已经交完材料啦。"
  ];
  if (round % 2 === 0) {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const dialogueBox = document.getElementById("dialogue");
    dialogueBox.innerHTML += `<p><strong>[张晨]</strong>：${msg}</p >`;
  }
}

function showChoices() {
  const choices = [
    { text: "好，我这就点链接", trustChange: 3 },
    { text: "这个流程我有点不太懂", trustChange: 0 },
    { text: "我可以线下面试吗？", trustChange: -2 }
  ];

  const container = document.getElementById("choices");
  container.innerHTML = "";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    btn.onclick = () => {
      trust += choice.trustChange;
      nextRound();
    };
    container.appendChild(btn);
  });
}

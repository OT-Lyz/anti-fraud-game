const API_URL = "https://api.deepseek.com/chat/completions";
const API_KEY = "你的API_KEY"; // 请在此替换为你自己的 DeepSeek Key

function generatePrompt(trust, strategy, state) {
  return `
你是一个虚拟招聘“HR”，目标是在不暴露诈骗身份的前提下，引导玩家点击缴费链接完成“入职”。
玩家当前信任度为：${trust}
心理状态：${state}
你应采用的说话策略是：${strategy}
请以一个真实HR的风格，输出一句不超过60字的中文回复。
`;
}

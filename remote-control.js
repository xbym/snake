const axios = require('axios');

// 配置
const config = {
    serverUrl: 'http://localhost:3000', // 本地测试用
    // serverUrl: 'https://your-heroku-app.herokuapp.com', // 生产环境用
};

// 远程控制函数
async function remoteControl(action) {
    try {
        const response = await axios.post(`${config.serverUrl}/api/remote-control`, {
            action: action
        });
        
        if (response.data.success) {
            console.log('操作成功：', response.data.message);
            console.log('当前死亡次数：', response.data.deaths);
            console.log('当前蛇长度：', response.data.gameState.snake.length);
        } else {
            console.error('操作失败：', response.data.message);
        }
    } catch (error) {
        console.error('请求失败：', error.message);
    }
}

// 执行自杀命令
console.log('执行蛇自杀命令...');
remoteControl('suicide'); 
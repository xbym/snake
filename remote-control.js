const axios = require('axios');

// 配置
const config = {
    serverUrl: process.env.SERVER_URL || 'http://localhost:3000', // 本地测试用
    productionUrl: 'https://morning-bastion-28400.herokuapp.com' // Heroku 生产环境
};

// 远程控制函数
async function remoteControl(action) {
    try {
        // 尝试生产环境
        try {
            const response = await axios.post(`${config.productionUrl}/api/remote-control`, {
                action: action
            });
            
            if (response.data.success) {
                console.log('操作成功：', response.data.message);
                console.log('当前死亡次数：', response.data.deaths);
                console.log('当前蛇长度：', response.data.gameState.snake.length);
                return;
            }
        } catch (prodError) {
            console.log('生产环境连接失败，尝试本地环境...');
        }

        // 如果生产环境失败，尝试本地环境
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

// 获取命令行参数
const args = process.argv.slice(2);
const action = args[0] || 'suicide';

// 执行命令
console.log(`执行命令: ${action}`);
remoteControl(action); 
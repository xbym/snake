const axios = require('axios');

// 配置
const config = {
    serverUrl: process.env.SERVER_URL || 'http://localhost:3000', // 本地测试用
    productionUrl: 'https://morning-bastion-28400.herokuapp.com' // 你的 Heroku 服务器地址
};

// 远程控制函数
async function remoteControl(action) {
    // 直接连接生产环境
    try {
        console.log('连接 Heroku 服务器...');
        const response = await axios.post(`${config.productionUrl}/api/remote-control`, {
            action: action
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'http://localhost:3000'
            },
            withCredentials: true
        });
        
        if (response.data.success) {
            console.log('\n✅ 操作成功');
            console.log('------------------------');
            console.log('操作结果：', response.data.message);
            console.log('死亡次数：', response.data.deaths);
            console.log('蛇长度：', response.data.gameState.snake.length);
            return;
        } else {
            console.error('❌ 操作失败：', response.data.message);
        }
    } catch (error) {
        console.error('\n❌ 连接失败');
        console.error('------------------------');
        if (error.response) {
            console.error('状态码：', error.response.status);
            console.error('错误信息：', error.response.data);
        } else {
            console.error('错误信息：', error.message);
        }
        console.error('\n请检查：');
        console.error('- Heroku 服务器是否在运行');
        console.error('- 网络连接是否正常');
        console.error('- 服务器地址是否正确');
        console.error('- API 路径是否正确 (/api/remote-control)');
    }
}

// 获取命令行参数
const args = process.argv.slice(2);
const action = args[0] || 'suicide';

// 执行命令
console.log('🚀 开始执行远程控制');
console.log('------------------------');
console.log('命令：', action);
remoteControl(action); 
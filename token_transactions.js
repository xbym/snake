const axios = require('axios');

async function getTokenTransactionHashes(tokenAddress, limit = 100) {
    try {
        const response = await axios.get(`https://public-api.solscan.io/token/transfers`, {
            params: {
                token: tokenAddress,
                limit: limit,
                offset: 0
            },
            headers: {
                'accept': 'application/json'
            }
        });

        // 直接返回交易哈希列表
        return response.data.data.map(tx => tx.signature);

    } catch (error) {
        console.error('Error fetching transaction hashes:', error);
        throw error;
    }
}

// 使用示例
async function main() {
    try {
        // 替换为你要查询的代币地址
        const tokenAddress = 'YOUR_TOKEN_ADDRESS';
        const hashes = await getTokenTransactionHashes(tokenAddress);
        
        console.log('交易哈希列表:');
        hashes.forEach(hash => console.log(hash));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 
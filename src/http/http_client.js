const axios = require('../../lib/axios.min')

const HttpClient = axios.create({
    baseURL: 'http://127.0.0.1:52700/wechat-plugin',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

module.exports = HttpClient
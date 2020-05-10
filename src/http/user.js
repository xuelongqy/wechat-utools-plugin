const HttpClient = require('./http_client')

/**
 * 搜索用户
 * @param keyword 关键字
 */
const searchUser = function (keyword) {
    return HttpClient.get('/user', {
        params: {
            "keyword": keyword,
        }
    })
}

/**
 * 用户聊天记录
 * @param userId 用户id
 */
const userChatLog = function (userId) {
    return HttpClient.get('/chatlog', {
        params: {
            "userId": userId,
            count: 45,
        }
    })
}

/**
 * 打开对话
 * @param userId 用户id
 */
const openSession = function (userId) {
    return HttpClient.post('/open-session', `userId=${userId}`)
}

/**
 * 返送消息
 * @param userId 用户id
 * @param content 消息内容
 * @param srvId 服务id
 */
const sendMsg = function (userId, content, srvId) {
    return HttpClient.post('/send-message', `userId=${userId}&content=${content}&srvId=${srvId}`)
}

module.exports = {
    searchUser,
    userChatLog,
    openSession,
    sendMsg
}
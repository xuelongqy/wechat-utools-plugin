const { replaceTifToBase64 } = require("../../util/image_util")
const {searchUser, userChatLog, openSession, sendMsg} = require('../../http/user')
const fs = require("fs")
const path = require("path")
const { exec } = require('child_process')

// 搜索状态(防止频繁请求导致微信崩溃)
let searching = false

// 记录输入的聊天内容
let inputContent = ''

// 是否注册快捷键
let isRegisteredHotKey = false

// 当前选中用户
let selectedUser = null

/**
 * 搜索用户
 * @param action 动作
 * @param callbackSetList 列表回调
 * @param searchWord 搜索关键字
 */
const handleSearchUser = function (action, callbackSetList, searchWord) {
    selectedUser = null
    // 注册快捷键
    registeredHotKey()
    if (!searching) {
        searching = true
        searchUser(searchWord || (action.type === 'over' ? action.payload : '')).then(async (response) => {
            let users = response.data
            if (users.length === 0) {
                throw users
            }
            callbackSetList(users.map((item) => {
                return {
                    type: 'user',
                    userId: item.userId,
                    title: item.title,
                    description: item.subTitle,
                    icon: item.icon || item.url || 'empty',
                    url: item.url
                }
            }))
            document.body.onload = replaceTifToBase64()
            searching = false
        }).catch((e) => {
            console.log(e)
            callbackSetList([
                {
                    title: '找不到联系人',
                    description: '请重新输入',
                }
            ])
            searching = false
        })
    }
}

/**
 * 用户聊天记录
 * @param action 动作
 * @param callbackSetList 列表回调
 * @param itemData 用户信息
 */
const handleUserChatLog = function (action, callbackSetList, itemData) {
    selectedUser = itemData
    let defaultList = [
        {
            type: 'chatlog',
            userId: itemData.userId,
            title: itemData.title,
            copyText: '',
            chatLogType: 'openSession',
            description: '打开会话',
            icon: itemData.url || itemData.icon || 'empty',
            url: itemData.url
        }
    ]
    callbackSetList(defaultList)
    userChatLog(itemData.userId).then(async (response) => {
        let chatLogs = response.data
        if (chatLogs.length === 0) {
            throw chatLogs
        }
        let chatLogList = chatLogs.map((item) => {
            return {
                type: 'chatlog',
                userId: item.userId,
                title: item.title,
                copyText: item.copyText,
                chatLogType: 'chatlog',
                description: item.subTitle,
                icon: item.icon || itemData.url || 'empty',
                url: item.url,
                srvId: item.srvId
            }
        })
        chatLogList[0].chatLogType = 'openSession'
        callbackSetList(chatLogList)
        document.body.onload = replaceTifToBase64()
        inputContent = ''
        window.utools.removeSubInput()
        window.utools.setSubInput(({text}) => {
            inputContent = text
        }, '聊天内容 Command: (Y)打开会话;(I)高清头像;(C)复制微信号;(E)退出')
    }).catch((e) => {
        console.log(e)
        callbackSetList(defaultList)
        searching = false
    })
}

/**
 * 打开对话
 * @param action 动作
 * @param itemData 需响应数据
 * @param callbackSetList 列表回调
 */
const handleOpenSession = function (action, callbackSetList, itemData) {
    if (itemData.userId) {
        openSession(itemData.userId).then(() => {
        }).catch(() => {
        })
        exec('open /Applications/WeChat.app')
    }
}

/**
 * 打开聊天记录
 * @param action 动作
 * @param itemData 需响应数据
 * @param callbackSetList 列表回调
 */
const handleChatLog = function (action, callbackSetList, itemData) {
    if (itemData.chatLogType === 'openSession') {
        handleSendMsg(action, callbackSetList, itemData)
    } else {
        if (itemData.title.includes('[图片]') ||
            itemData.title.includes('[视频]')) {
            window.utools.shellOpenItem(itemData.copyText)
        } else if (itemData.title.includes('[表情]')) {
            let emojiPath = path.resolve(itemData.copyText, '..')
            let emojiDir = fs.readdirSync(emojiPath)
            let emojiName = itemData.copyText.replace(emojiPath + '/', '')
            emojiDir.forEach((item) => {
                if (item.indexOf(emojiName) >= 0) {
                    window.utools.shellOpenItem(emojiPath + '/' + item)
                }
            })
        } else if (itemData.title.includes('[语音]')) {
            sendMsg(itemData.userId, '', itemData.srvId).then(() => {
            }).catch(() => {
            })
        } else {
            let clickIndex = window.utools.showMessageBox({
                type: 'info',
                title: '聊天记录',
                message: itemData.copyText,
                buttons: ['确定', '复制'],
                defaultId: 0,
            })
            if (clickIndex === 1) {
                window.utools.copyText(itemData.copyText)
                window.utools.showNotification(`已将聊天内容复制到剪贴板`)
            }
        }
    }
}

/**
 * 发送消息
 * @param action 动作
 * @param itemData 需响应数据
 * @param callbackSetList 列表回调
 */
const handleSendMsg = function (action, callbackSetList, itemData) {
    if (inputContent && inputContent.length >= 0) {
        sendMsg(itemData.userId, inputContent, itemData.srvId).then(() => {
            // 更新聊天记录
            handleUserChatLog(action, callbackSetList, selectedUser)
        }).catch(() => {
        })
    } else {
        window.utools.hideMainWindow()
        handleOpenSession(action, callbackSetList, itemData)
        window.utools.outPlugin()
    }
}

/**
 * 注册快捷键
 */
const registeredHotKey = function () {
    if (isRegisteredHotKey) return
    isRegisteredHotKey = true
    let listener = (event) => {
        if (event.code === 'KeyY') { // Command + Y，打开会话
            if (!selectedUser) return
            window.utools.hideMainWindow()
            handleOpenSession(null, null, selectedUser)
            window.utools.outPlugin()
        } else if (event.code === 'KeyC') { // Command + C，复制微信号
            if (!selectedUser) return
            window.utools.copyText(selectedUser.userId)
            window.utools.showNotification(`已将好友 ${selectedUser.title} 的微信号复制到剪贴板`)
        } else if (event.code === 'KeyI') { // Command + I，查看头像
            if (!selectedUser) return
            window.utools.shellOpenExternal(selectedUser.url)
        } else if (event.code === 'KeyE') { // Command + E，退出
            window.utools.hideMainWindow()
            window.utools.outPlugin()
        }
    }
    window.addEventListener('keydown', listener, true)
}

module.exports = {
    handleSearchUser,
    handleUserChatLog,
    handleOpenSession,
    handleChatLog
}


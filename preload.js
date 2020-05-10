const { handleSearchUser, handleUserChatLog, handleChatLog } = require('./src/action/wx/user')

// 微信搜索
window.exports = {
    "wx": {
        mode: "list",  // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                handleSearchUser(action, callbackSetList)
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                handleSearchUser(action, callbackSetList, searchWord)
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                let type = itemData.type
                if (type === 'user') {
                    handleUserChatLog(action, callbackSetList, itemData)
                } else if (type === 'chatlog') {
                    handleChatLog(action, callbackSetList, itemData)
                }
            },
            // 子输入框为空时的占位符
            placeholder: "搜索微信用户"
        }
    }
}
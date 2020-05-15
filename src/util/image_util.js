const UTIF = require('../../lib/UTIF')

/**
 * 替换tif图片(本地)为Base64
 * @returns
 */
const replaceTifToBase64 = async function() {
    let imgList = document.getElementsByTagName("img")
    for (let i=0; i < imgList.length; i++)
    {
        try {
            let img = imgList[i]
            let src = img.getAttribute("src")
            if (!src) continue
            let prefix = 'file:///'
            if (!src.startsWith(prefix)) continue;
            // 获取本地真实地址
            let realSrc = '/' + src.split('//')[2]
            let xhr = new XMLHttpRequest()
            UTIF._xhrs.push(xhr)
            UTIF._imgs.push(img)
            xhr.open("GET", realSrc)
            xhr.responseType = "arraybuffer"
            xhr.onload = UTIF._imgLoaded
            xhr.send()
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = {
    replaceTifToBase64
}
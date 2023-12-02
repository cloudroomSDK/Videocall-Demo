//生成随机数
const randomNumstr = (length) => {
    if (typeof (length) != "number") {
        length = 4;
    }
    var numStr = "";
    for (var i = 0; i < length; i++) {
        numStr += Math.floor(Math.random() * 10)
    }
    return numStr;
}
/*
 ** randomWord 产生任意长度随机字母数字组合
 ** randomFlag-是否任意长度 min-任意长度最小位[固定位数] max-任意长度最大位
 */
function randomWord(randomFlag, min, max) {
    var str = "",
        pos = '',
        range = min,
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    // 随机产生
    if (randomFlag) {
        range = Math.round(Math.random() * (max - min)) + min;
    }
    for (var i = 0; i < range; i++) {
        pos = Math.round(Math.random() * (arr.length - 1));
        str += arr[pos];
    }
    return str;
}



module.exports = {
    randomNumstr,
    randomWord,
    // 封装微信弹出提示
    showToast(text = '', time = 1500, mask = false) {
        // 提示文字，持续时间，是否显示遮罩
        wx.showToast({
            title: text,
            icon: 'none',
            duration: time,
            mask,
        });
    },
    // 右上角分享默认样式
    defaultShare() {
        return {
            title: '视频呼叫Demo',
            imageUrl: '/image/share.jpg',
            path: '/pages/login/login',
            success: function (res) {}
        }
    },
    //隐藏提示
    hideToast() {
        wx.hideToast()
    },
    // 弹出等待层
    showLoading({
        title = '请稍候',
        mask = true
    }) {
        wx.showLoading({
            title,
            mask
        });
    },
    // 隐藏等待层
    hideLoading() {
        wx.hideLoading();
    },
    //给所有页面发消息（使用场景：假如我在视频页面，现在跳转到了设置页面，发送消息时视频页面也将收到消息）
    sendAllPagesMessage(event, arg) {
        getCurrentPages().forEach(item => {
            try {
                item.onMessage && item.onMessage[event] && item.onMessage[event].apply(item, arg);
            } catch (error) {
                console.error(error);
            }
        });
    },
    //给当前页发消息（使用场景：假如我在视频页面，现在跳转到了设置页面，那么只有设置页面能收到消息）
    sendPageMessage(event, arg) {
        try {
            const allPages = getCurrentPages();
            const curPage = allPages[allPages.length - 1];
            curPage.onMessage && curPage.onMessage[event] && curPage.onMessage[event].apply(curPage, arg);
        } catch (error) {
            console.log(error);
        }
    },
    //函数防抖
    debouncePro(fn, delay) {
        // delay毫秒内必须执行一次且只执行一次fn
        let timer,arg;
        return function () {
            arg = arguments;
            if(!timer){
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(this, arg)
                }, delay);
            }
        }
    }
};


/**
 *主页界面控制对象
 */
var home = {
    /**
     *当前的浮动窗口
     */
    curContentIndex : null,
    /**
     *底部导航对象
     */
    tabView : null,
    /**
     *窗口列表
     */
    contentList : [{
        label : "洗涤",
        icon : "fa-home",
        // badge:1,//右上角上标
        isPopover : true, //是否是浮动窗口
        url : "home_content0.html"
    }, {
        label : "护理",
        icon : "fa-user",
        isPopover : true,
        url : "home_content1.html"
    }, {
        label : "生活",
        icon : "fa-search",
        isPopover : true,
        url : "home_content2.html"
    }, {
        label : "我的",
        icon : "fa-search",
        isPopover : false, //不是浮动窗口，直接打开新窗口
        url : "member.html"
    }],
    /**
     *初始化界面
     */
    initPage : function(defIndex) {
        var self = this;
        //初始化底部导航
        self.initTab();
        //初始化事件
        self.initEvent();
        //默认触发菜单
        self.clickTabView(defIndex);
    },
    /**
     *点击tabview
     */
    clickTabView : function(curIndex) {
        $('div[data-index="' + curIndex + '"]').trigger("tap");
    },
    /**
     *初始化tab
     */
    initTab : function() {
        var self = this;
        self.tabView = appcan.tab({
            selector : "#footer",
            hasIcon : true,
            hasAnim : false,
            hasLabel : true,
            hasBadge : true,
            index : 3,
            //复用定义的列表
            data : self.contentList
        });
    },
    /**
     *重置当前窗口位置
     */
    resizeCurrentPop : function() {
        var self = this;
        var curContentIndex = self.curContentIndex;
        var curContentName = "content" + curContentIndex;
        var titHeight = $('#header' + curContentIndex).offset().height;
        //重置当前页的高度和宽度
        appcan.window.resizePopoverByEle("content", 0, titHeight, curContentName);
    },
    /**
     *初始化事件
     */
    initEvent : function() {
        var self = this;
        window.onorientationchange = window.onresize = function() {
            self.resizeCurrentPop();
            //重置当前窗口位置
        };
        //菜单的点击事件
        self.tabView.on("click", function(obj, curIndex) {
            //打开对应的界面
            self.openContent(curIndex);
        });
        //打开购物车
        appcan.button("#test", "btn-act", function() {
            self.resizeCurrentPop();
            //
        });
        //打开购物车
        appcan.button(".event_open_cart", "btn-act", function() {
            NAV.openCart();
            //
        });
    },
    /**
     *打开窗口
     */
    openContent : function(curIndex) {
        var self = this;
        //缓存旧的当前页
        var oldContentIndex = self.curContentIndex;
        var oldContentName = 'content' + oldContentIndex;
        var newContentName = "content" + curIndex;
        if (newContentName == oldContentName) {
            //如果还是当前的索引，不动
            return;
        }
        //给当前页重新赋值
        self.curContentIndex = curIndex;
        var contentObj = self.contentList[curIndex];
        var oldContentObj = self.contentList[oldContentIndex];
        if (contentObj.isPopover == false) {
            //说明不是pop页面，直接打开新窗口
            appcan.openWinWithUrl(contentObj.url, CONFIG.htmlBaseUrl + contentObj.url);
            //因为浮动窗口未变，所以但是样式改变了，要还原到上一个状态
            self.clickTabView(oldContentIndex);
            return;
        }
        //基本的处理，打开浮动窗口，设置窗口大小
        for (var i = 0; i < self.contentList.length; i++) {
            //处理头部的多个标题隐藏和显示
            if (i == curIndex) {
                $("#header" + curIndex).removeClass("uhide");
            } else {
                $("#header" + i).addClass("uhide");
            }
        }
        var titHeight = $('#header' + curIndex).offset().height;
        //另外如果header高度为0，会出现切换回来后，头部导航被遮罩了，所以要把老的浮动窗口设置到窗口外部
        if (oldContentObj && oldContentObj.isOpen) {
            //TODO:如果旧窗口已经打开，改变旧窗口大小，位置移出到屏幕外围，因为无法通过设置底层的方法来达到目的
            appcan.window.resizePopoverByEle("content", 0, -9999, oldContentName);
        }
        if (contentObj && contentObj.isOpen) {
            //如果已经打开，重置设置窗口大小
            appcan.window.resizePopoverByEle("content", 0, titHeight, newContentName);
            //把新窗口置顶
            appcan.frame.bringToFront(newContentName);
        } else {
            var extraInfo = JSON.stringify({
                "extraInfo" : {
                    "opaque" : "true",
                    "bgColor" : "#ecf3f7",
                    "delayTime" : "250"
                }
            });
            contentObj.isOpen = true;
            //执行打开
            appcan.frame.open("content", contentObj.url, 0, titHeight, newContentName, "", "", extraInfo);
        }

    }
}
//历史留下的全局对象
var winPlat = window.navigator.platform;
var isPhone = !(winPlat == 'Win32' || winPlat == 'Win64' || winPlat == 'MacIntel' || winPlat == 'Linux i686' || winPlat == 'Linux x86_64');
var isAndroid = (window.navigator.userAgent.indexOf('Android') >= 0) ? true : false;
var isIOS = (winPlat == 'iPad' || winPlat == 'iPod' || winPlat == 'iPhone');
/*是否在模拟器上运行, 1是0否*/
var isSML = (window.navigator.platform == 'Win32') ? 1 : 0;

//公共的模块或其他全局函数写到这里

//是否是开发模式，上线后，要改为false
var IS_DEV = true;
/**
 *配置信息类 
 */
var CONFIG={
    ////open html界面的基础地址，主要为调试的话可以打开http地址
    htmlBaseUrl : "",
    //mas服务器地址
    masServerUrl:"http://121.40.240.34:9998/meeting/" 
}
/**
 *判断是否是调试模式，是的话，重置config配置，避免注释太多 
 */
if(IS_DEV){
    //如果是开发模式,重新改变config配置
    CONFIG={
        ////open html界面的基础地址，主要为调试的话可以打开http地址
        htmlBaseUrl : "",
        //mas服务器地址
        masServerUrl:"http://127.0.0.1:9998/meeting_stub/" 
    }
}

/**
 *页面导航类，所有的界面从这个类的方法进行打开，减少页面内部对条件的判断，提前做好约束
 */
var NAV = {
    
    /**
     *打开登录
     * @param {Object} user_name 用户名
     */
    openLogin: function () {
        var self = this;
        appcan.openWinWithUrl("login_win", CONFIG.htmlBaseUrl + "login.html");
    },
    /**
     *打开首页 ,会议列表
     */
    openIndex:function(){
        appcan.openWinWithUrl("index", CONFIG.htmlBaseUrl + "meeting_list.html");
    }
}
/**
 *统一的子应用退出
 */
function exit(){
   if (IS_DEV) {
        //开发模式
        appcan.window.close();
    } else {
        //上线模式，提示退出系统
        uexWindow.cbConfirm = function (opId, dataType, data) {
            if (data == 0) {
                //选择了第一个按钮，确定退出，调用方法获取当前app信息
                if(uexWidgetOne){
                    uexWidgetOne.getCurrentWidgetInfo();//获取当前app信息
                    uexWidgetOne.cbGetCurrentWidgetInfo = function(opId,dataType,data){
                        //data ={"widgetId":"","appId":"aaagl10009","version":"00.00.0005","name":"kq_wgt_oa","icon":"icon.png"} 
                        var widgetInfo = eval('('+data+')');
                        var appId=widgetInfo.appId;//appid
                        //var appName=widgetInfo.name;//appname
                        uexWidget.finishWidget("",appId,"0");
                    }
                }else{
                     TOOLS.openToast('uexWidgetOne对象不存在', 1500, 5, 0,false)
                }
            }
        };
        uexWindow.confirm("警告", "确定退出么？", "确定,取消");
    } 
}
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
/**
 *返回字符的字节长度（汉字算2个字节）  
 */
String.prototype.getByteLen = function() {
    var val = this;
    var len = 0;
    for (var i = 0; i < val.length; i++) {
        if (val[i].match(/[^x00-xff]/ig) != null)//全角 中文
            len += 2;
        else
            len += 1;
    };
    return len;
}

/**
 *表单数据转换为对象 $('form'). serializeObject();
 */
$.fn.serializeObject = function () {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

/**
 * 工具方法模块 
 */
appcan.define('oa_tools', function ($, exports, modules) {
    function tools(key) {
        /**
         *唯一的key值，避免本地缓存，通知事件名称重复
         */
        this.unique_key = key;
        /**
         * 获取和设置本地缓存
         * var t=store('key') ; //获取
         * store('key','value');//set
         */
        this.store = function () {
            var self = this;
            if (arguments.length === 1) {
                //说明是get
                var value = appcan.locStorage.getVal(self.unique_key + arguments[0]);
                return value;
            } else if (arguments.length === 2) {
                //说明是set
                appcan.locStorage.setVal(self.unique_key + arguments[0], arguments[1]);
            }
        };
        /**
         *删除本地缓存
         * removeStore(); //删除所有缓存
         * removeStore('key'); //删除确定的缓存
         */
        this.removeStore = function (key) {
            var self = this;
            if (key) {
                //有传入具体的key
                appcan.locStorage.remove(self.unique_key + key)
            } else {
                //没有传入key，默认删除本应用的缓存
                //返回值是数组，包含所有的key
                var keys = appcan.locStorage.keys();
                // keys=['crm','crm1','crm2'];
                var i = 0, length = keys.length;
                //为了避免删除其他应用的缓存，所以先遍历所有的key
                for (i; i < length; i++) {
                    var keyname = keys[i];//keyname=crm1 ,self.unique_key=crm
                    if (keyname.indexOf(self.unique_key) == 0) {
                        //找到了，从头匹配的key，说明是本应用的缓存
                        appcan.locStorage.remove(keyname);
                    }
                }
            }
        };
        /**
         * 打开遮罩层，并给出提示信息
         * @param String msg 显示信息;
         * @param Number duration 显示时间;
         * @param Number position 显示位子;
         * @param Number type 显示加载图标;
         * @param boolean shade 是否全屏遮罩
         */
        this.openToast = function(msg,duration,position,type,shade){
            var self = this;
            if(shade){
                //全屏遮罩
                appcan.window.open('oa_toast','oa_toast.html');
                appcan.window.openToast(msg,duration,position,type);
                //当参数数大于2时，给出对应时间延迟
                setTimeout(function(){
                    self.publish('oa_toast','');
                },duration);
            }else{
                //不是全屏遮罩
                appcan.window.openToast(msg,duration,position,type);
            }
        };
        /**
         * 关闭遮罩层 
         */
        this.closeToast = function(){
            appcan.window.closeToast();
        };
        /**
         * 输出log
         * @param String s 需要输出的信息
         * @param String a 添加的标注信息
         */
        this.logs = function (s, a) {
            if (typeof s == 'object') {
                s = JSON.stringify(s);
            }
            a = a ? a : "";
            if (!isPhone) {
                console.log(a + s);
            } else {
                uexLog.sendLog(a + s);
            }
        };
        /**
         * 注册通知
         * setPublish('subscribe_name',function(args){alert(args)});
         */
        this.setPublish = function (subscribe_name, cb) {
            var self = this;
            var name = self.unique_key + subscribe_name;
            appcan.window.subscribe(name, cb);
        };
        /**
         *响应通知
         * publish('subscribe_name','1')
         */
        this.publish = function (subscribe_name, args) {
            var self = this;
            var name = self.unique_key + subscribe_name;
            appcan.window.publish(name, args);
        };
        /**
         *执行窗口间脚本
         * var obj={name:'主窗口名称',popName:'子窗口名称',scriptContent:'执行脚本'}
         * evaluateScript({name:'wina',scriptContent:'alert(1)'}) //执行主窗口
         * evaluateScript('wina','alert(1)');//执行主窗口
         * evaluateScript({name:'wina',popName:'content',scriptContent:'alert(1)'}) //执行浮动窗口
         * evaluateScript('wina','content','alert(1)');//执行子窗口
         */
        this.evaluateScript = function (args) {
            var self = this;
            var obj = {};
            if (appcan.isPlainObject(args)) {
                //说明是对象，执行对象的参数
                obj = arguments[0];
            } else {
                //是字符串，判断参数个数
                if (arguments.length === 2) {
                    //说明是执行父窗口
                    obj.popName = null;
                    obj.name = arguments[0];
                    obj.scriptContent = arguments[1];
                } else if (arguments.length === 3) {
                    //说明是执行子窗口
                    obj.name = arguments[0];
                    obj.popName = arguments[1];
                    obj.scriptContent = arguments[2];
                }
            }
            if (obj.popName) {
                //执行子窗口
                uexWindow.evaluatePopoverScript(obj.name, obj.popName, obj.scriptContent);
            } else {
                //不存在子窗口，执行父窗口
                // uexWindow.evaluateScript(obj.name,'',obj.scriptContent);
                appcan.window.evaluateScript(obj.name, obj.scriptContent);
            }
        };
    }
    modules.exports = new tools('oa');
});

var TOOLS = appcan.require('oa_tools');

/**
 * 设置平台弹动效果
 * @param Function downcb 下拉
 * @param Function upcb   上拖
 */
//前台调用
// appcan.ready(function(type) {
// appcan.window.setBounce(1);
// setPageBounce(downcb,upcb);
// function mes(){
// alert(1);
// }
// });
function setPageBounce(downcb, upcb) {
    uexWindow.setBounce("1");
    var top = 0,
        btm = 1;
    if (!downcb && !upcb) {
        uexWindow.showBounceView(top, "rgba(255,255,255,0)", "0");
        uexWindow.showBounceView(btm, "rgba(255,255,255,0)", "0");
        return;
    }
    uexWindow.onBounceStateChange = function (type, state) {
        if (type == top && state == 2) {
            //顶部弹动
            downcb();
            setTimeout(function () {
                appcan.window.resetBounceView(0)
            }, 500);
        }

        if (type == btm && state == 2) {
            //底部弹动
            upcb();
            setTimeout(function () {
                appcan.window.resetBounceView(1)
            }, 500);
        }
    }
    if (downcb) {
            uexWindow.setBounceParams(0, '{"imagePath":"res://refesh_icon.png","pullToReloadText":"下拉刷新","levelText":"凯泉欢迎您","releaseToReloadText":"释放回原处","loadingText":"加载中，请稍候","loadingImagePath":"res://refesh_icon.png"}');
            uexWindow.showBounceView(top, "#E0E0E0", 1);
            uexWindow.notifyBounceEvent(top, 1);
        }
    if (upcb) {
        uexWindow.setBounceParams(1, '{"imagePath":"res://refesh_icon.png","pullToReloadText":"加载更多","levelText":"凯泉欢迎您","releaseToReloadText":"加载更多","loadingText":"加载中，请稍候","loadingImagePath":"res://refesh_icon.png"}');
        uexWindow.showBounceView(btm, "#E0E0E0", 1);
        //设置弹动位置及效果([1:显示内容;0:不显示])
        uexWindow.notifyBounceEvent(btm, 1);
        //注册接收弹动事件([0:不接收onBounceStateChange方法回调;1:接收])
    }
}
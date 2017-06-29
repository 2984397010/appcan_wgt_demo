appcan.define('model_ajax', function ($, exports, modules) {
    /**
     *数据请求模块
     */
    var ajaxServer = {
        /**
         *通过参数获取lockkey，唯一值
         */
        getLockKey: function (string) {
            if (string) {
                //有option对象，把它变成字符串
                string=encodeURI(string);//有时候string可能有特殊字符，所以变化转换下，避免md5异常
                var md5 = appcan.crypto.md5(string);
                return md5;
            }
        },
        /**
         *ajax调用 
         */
        ajax: function (ajaxOption) {
            var self = this;
            var lockKey = self.getLockKey(JSON.stringify(ajaxOption.option));
            if (self[lockKey]) {
                //如果锁定请求的话，不再提交
                return;
            }
            //加请求锁
            self[lockKey] = true;
            //打开请求提示
            TOOLS.openToast('数据请求中', 0, 5, 0);
            $.ajax({
                url: ajaxOption.option.url,
                type: ajaxOption.option.type,
                timeout: 5000,
                data: ajaxOption.option.data,
                //headers : self.getHeaders(), //获取mas请求头
                success: function (data) {
                    self[lockKey] = null;
                    //关闭请求提示
                    TOOLS.closeToast();
                    if (ajaxOption.success) {
                        //执行参数传入的成功处理，不做通用的处理返回
                        ajaxOption.success(data);
                    } else {
                        //先进入通用的res提示，处理返回数据
                        self.resTip(data, ajaxOption.callBack);
                    }
                },
                error: function (e) {
                    self[lockKey] = null;
                    if (ajaxOption.error) {
                        ajaxOption.error(e);
                    } else {
                        self.errTip(e);
                    }
                }
            });
        },
        /**
         *加载模板返回
         */
        loadTemplate: function (template_path) {
            var template_url = CONFIG.htmlBaseUrl + template_path;
            var template_body = '';
            //同步方法获取
            $.ajax({
                url: template_url,
                type: 'GET',
                data: {}, //默认从参数获取
                timeout: 10000,
                async: false,
                success: function (data) {
                    template_body = data;
                },
                error: function (e) {

                }
            });
            return template_body;
        },
        
        /**
         *构建模板对象
         ** @param {Object} template_html 模板的html或模板文件
         */
        buildTpl: function (template_html) {
            var self = this;
            /**
             *判断传入的参数是否为路径，先简单的进行判断
             */
            function isPath(template_html) {
                var flag = false;
                var length = template_html.length;//获取文档长度
                //获取最后的5个字符，来判断
                var key = template_html.substring(length - 5);
                if (key.indexOf('.html') > -1) {
                    //说明最后结尾时.html的，是一个路径
                    flag = true;
                }
                return flag;
            }

            if (isPath(template_html)) {
                //说明时一个路径，就调用loadTemplate去获取文件
                template_html = self.loadTemplate(template_html);
            } else {
                //说明时文件，直接可以编译文档
            }
            var _ = appcan.require('underscore');
            //生成模板对象
            var _tmp = _.template(template_html);
            return _tmp;
        },
        
        /*
         *使用模板的方式输出
         * @param {Object} template_html 模板的html
         * @param {Object} data 模板要传入的值
         */
        template: function (template_html, data) {
            var _ = appcan.require('underscore');
            //生成模板对象
            var _tmp = _.template(template_html);
            //模板传入data值，输出html
            var html = _tmp(data);
            return html;
        },
         /**
          * 获取文件大小,请求文件头避免下载整个文件
          */
        getFileSize:function(path,callBack){
            var xhr = $.ajax({
              type: "HEAD",
              url: path,
              success: function(msg){
                  var bytes=xhr.getResponseHeader('Content-Length');
                  callBack(bytes);
              },
              error:function(e){
                  //存在跨域或无法获取地址问题
                  callBack(0);
              }
            });
        },
        /**
         *异常提示
         */
        errTip: function (e) {
            var self=this;
            TOOLS.openToast('请求异常,请稍后再试' + JSON.stringify(e), 1200, 5, 0);
            self.doReEvent();//自动判断是否再次执行有异常的请求
            TOOLS.logs('请求异常,请稍后再试' + JSON.stringify(e));
        },
        /**
         *自动判断是否再次执行有异常的请求
         */
        doReEvent:function(){
            //约定如果有网络异常超时需要系统自动重试，需要在store里面增加RE_EVENT值 
            //RE_EVENT= login.doLogin()  ,里面的参数不能是对象，所以写到时候，接口参数尽量简单
             var reEvent=TOOLS.store('RE_EVENT');
             if(reEvent){
                 //如果有定义异常就执行下
                appcan.window.alert({
                  title : "提示",
                  content : "是否要重试?",
                  buttons : ['确定', '取消'],
                  callback : function(err, data, dataType, optId) {
                      if(!err){
                          if(data==0){
                              //点击 了确定
                             TOOLS.removeStore('RE_EVENT');//执行前把事件再清空
                             eval(reEvent);//TODO 用eval函数来重新执行，这个其实不好,但是也没有其他好方法
                          }else{
                              //点击了取消，啥也不做
                          }
                      }
                  }
                });
             }
        },
        /**
         *ajax恢复提示
         * @param {Object} data ajax返回的数据
         * @param {Object} callbackfun 回调函数
         */
        resTip: function (data, callbackfun) {
            var self = this;
            if (typeof (data) == "string") {
                //简单的进行判断，如果是字符串的话，把他变为对象
                if(data.substring(0,1)=="{"){
                    try{
                        data = JSON.parse(data);
                    }catch(e){
                       TOOLS.openToast('返回数据不是json格式', 1200, 5, 0);
                       return;
                    }
                }else{
                    //返回的是html字符串
                    callbackfun(data);
                    return;
                }
            }
            if (self.successCallbackfun) {
                //如果有定义成功的返回函数，就执行自定义的函数注入
                self.successCallbackfun(data);
                return;
            }
            if (data.status === 0) {
                //如果是正常的话
                if (callbackfun) {
                    //这里执行正常的回调
                    callbackfun(data);
                }
            } else if (data.status && data.message) {
                TOOLS.openToast(data.message, 1200, 5, 0);
                //有错误代码，给予提示，不做callback返回
                if(data.status===-99){
                    //未登录或登陆超时状态
                    self.doReEvent();//自动判断是否再次执行有异常的请求
                    NAV.openReLogin();//打开重复登陆界面
                }
            } else {
                //其他情况,做好callback返回
                TOOLS.openToast('未知异常', 1200, 5, 0);
            }
        },
        /**
         *登录提交
         * @param {Object} data
         * @param {Object} callBack
         */
        login: function (data, callBack) {
            var self = this;
            self.ajax({
                option: {
                    type: 'get',
                    url: CONFIG.masServerUrl + 'login',
                    data: data
                },
                callBack: function (ajaxdata) {
                    //默认成功定处理返回信息
                    callBack(ajaxdata);
                }
            });
        },
        /**
         * 查询会议室
         * @param {Object} data
         * @param {Object} callBack
         */
        qryMeeting:function(data,callBack){
            var self = this;
            self.ajax({
                option: {
                    type: 'get',
                    url: CONFIG.masServerUrl + 'qryMeeting/all',
                    data: data
                },
                callBack: function (ajaxdata) {
                    //默认成功定处理返回信息
                    callBack(ajaxdata);
                }
            });
        }
    }
    modules.exports = ajaxServer;
});

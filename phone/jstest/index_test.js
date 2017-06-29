
QUnit.module("demo模块测试", {
    beforeEach : function() {
        // module执行开始操作
        var ajax_server = appcan.require('model_ajax');
        this.ajax_server = ajax_server;
        console.log('增加ajax_server引用');
    },
    afterEach : function() {
        // module执行完毕后操作
        this.ajax_server = null;
        console.log('清除ajax_server引用 ');
    }
});

QUnit.asyncTest('crm模块ajax请求 测试正确返回', function(assert) {
    var self = this;
    //获取index.html接口链接页面数据
    var tpl =self.ajax_server.loadTemplate(CONFIG.masServerUrl + 'index.html?n='+new Date());
    //定义index.html页面对象
    var $a = $(tpl);
    //循环遍历对象数据
    $a.find('a').each(function(){
        //获取当前对象
        var $this = $(this);
        //获取链接元素a的href属性的值
        var href = $this.attr('href');
        //拼接ajax请求地址
        var url = CONFIG.masServerUrl + href;
        //执行ajax请求
        indexTest(url,function(status,data){
            if(status==0){
                if(data.status==0){
                    //请求成功
                    assert.ok(true, url+'数据获取成功');   
                }else{
                    //请求失败
                    assert.ok(false,url+ '数据获取失败');   
                }
            }else if(status==1){
                //请求成功
                assert.ok(true, url+'数据获取成功');   
            }else if(status==2){
                //请求异常
                assert.ok(false, url+data);   
            }
        });
    });
}); 

function indexTest(url,cb){
     $.ajax({
        url: url,
        type: 'GET',
        timeout: 10000,
        success: function (ajax_data) {
            if (typeof (ajax_data) == "string") {
                //如果是字符串的话，把他变为对象
                if(ajax_data.substring(0,1)=='{'){
                    try{
                        //转换数据类型，string转换为json
                        ajax_data = JSON.parse(ajax_data);
                        cb(0,ajax_data);
                    }catch(e){
                       TOOLS.openToast('返回数据不是json格式', 1200, 5, 0);
                    }
                }else{
                    //返回的是html字符串
                    cb(1,ajax_data);
                }
            }else if(typeof (ajax_data)=="object"){
                //json数据
                cb(0,ajax_data);
            }
        },
        error: function (e) {
            //请求异常
           cb(2,JSON.stringify(e));
        }
    });
}


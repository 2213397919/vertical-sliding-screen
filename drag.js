(function (w) {
    w.drag=function (conWrap,content,navList,callback) {
        //开启3D变换，防止文字抖动。
        transformCss(navList,'translateZ',0.1);
        //定义元素初始位置
        var eleY = 0;
        //定义手指初始位置
        var startY = 0;
        //定义手指初始位置
        var startX = 0;
        //加速
        //元素的初始位置
        var s1 = 0;
        //起始时间
        var t1 = 0;
        //元素结束位置
        var s2 = 0;
        //结束时间
        var t2 = 0;
        //距离差
        var disS = 0;
        //时间差（非零数字）
        var disT = 0.1;
        //定时器
        var timer=null;
        //第一次防抖动逻辑
        var isFirstY=true;
        //非第一次防抖动逻辑
        var isY=true;
        //Tween算法
        var Tween = {
            //加速（ease） === 匀速
            Linear: function(t,b,c,d){ return c*t/d + b; },
            //回弹
            easeOut: function(t,b,c,d,s){
                if (s == undefined) s = 1.70158;
                return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
            }
        };
        conWrap.addEventListener('touchstart',function(event){
            var touch = event.changedTouches[0];
            //清除定时器 ,真正即点即停，清除定时器(加速中，第二次touchstart才生效)
            clearInterval(timer);
            //清除过渡
            content.style.transition = 'none';
            //元素初始位置
            eleY = transformCss(content,'translateY');
            //手指初始位置
            startY = touch.clientY;
            //手指初始位置
            startX = touch.clientX;
            //加速
            s1 = eleY;
            t1 = new Date().getTime(); //毫秒

            //清除距离差 （清除上一次speed）
            disS = 0;
        //    防抖动，重置
            isFirstY=true;
            isY=true;

            if(callback && typeof callback['start'] === 'function'){
                callback['start']();
            };
        });
        conWrap.addEventListener('touchmove',function(event){
            var touch = event.changedTouches[0];
            if (!isY){
                return;
            }
            //手指结束位置
            var endY = touch.clientY;
            //手指距离差
            var disY = endY - startY;
            //防抖动
            //手指结束位置
            var endX = touch.clientX;
            //手指距离差
            var disX = endX - startX;
            if(isFirstY){
                isFirstY=false;
                if (Math.abs(disX)>Math.abs(disY)){
                    isY=false;
                    return;
                }
            }

            //范围限定，橡皮筋拖（越来越难拖）
            var translateY = disY+eleY;
            if(translateY > 0){

                //每一步需要逐渐减小   scale  (scale逐渐减小)
                // 比例 = 1 - 左边留白/屏幕宽
                var scale = 0.6 - translateY/(document.documentElement.clientHeight*3);

                //translateY 整体增加,每一次增加的幅度在减小
                //抛物线
                //新的左边留白 = 之前左边留白 * scale
                //新的translateY = 左边的临界值 0 + 新的左边留白
                translateY = 0 + translateY * scale;

            }else if(translateY < document.documentElement.clientHeight-content.offsetHeight){
                //右边留白（必须是正值） = translateY - 临界值
                var over = Math.abs(translateY)-(content.offsetHeight-document.documentElement.clientHeight)
                //每一步需要逐渐减小   scale  (scale逐渐减小)
                // 比例 = 1 - 右边留白/屏幕宽
                var scale = 0.6 - over/(document.documentElement.clientHeight*3);

                //新的右边留白(新的over) = 之前右边留白 * scale

                //新的translateY = 临界值 +新的右边留白(新的over)
                //前提条件必须在右边达到临界值的基础上，出现over
                translateY = document.documentElement.clientHeight-content.offsetHeight - over * scale;
            };

            //确定元素最终位置
            transformCss(content,'translateY',translateY);

            //加速
            s2 = translateY;
            t2 = new Date().getTime();
            //距离差
            disS = s2 - s1;
            //时间差
            disT = t2 - t1;

            if(callback && typeof callback['move'] === 'function'){
                callback['move']();
            };

        });
        //加速
        conWrap.addEventListener('touchend',function(){
            //速度 = 距离差/时间差
            var speed = disS/disT;

            //目标距离 = touchmove 产生位移值（读取） + 速度产生的距离
            var target = transformCss(content,'translateY') + speed*100;

            //橡皮筋回弹
            var type='Linear';
            if(target > 0){
                target = 0;
                type='easeOut';
            }else if(target < document.documentElement.clientHeight-content.offsetHeight){
                target = document.documentElement.clientHeight-content.offsetHeight;
                type='easeOut';
            };
            //总时间
            var timeAll=1;
            moveTween(target,type,timeAll);

        });
    //    封装Tween算法移动
    //    target:滑动的距离，即目标距离。
    //    type：判断是匀速还是回弹。
    //    time：S-M-E，离开后滑动的总时间。
        function moveTween(target,type,timeAll) {
            //t:当前次数(从1开始)
            var t=0;
            // b : 元素加速的起始位置
            var b=transformCss(content,'translateY');
            // c : 元素加速的结束位置与加速的起始位置的 距离差
            var c=target-b;
        //    d : 总次数    总次数 = 总时间/每一个次的时间   （单位）
            var d=timeAll/0.02;
        //    创建定时器，
            timer=setInterval(function () {
                t++;
                if (t>d){
                    if(callback && typeof callback['end'] === 'function'){
                        callback['end']();
                    };
                    //元素不能移动，清除定时器
                    clearInterval(timer);
                }else {
                    if(callback && typeof callback['move'] === 'function'){
                        callback['move']();
                    };
                    //正常语句移动的部分
                    var point = Tween[type](t,b,c,d);
                    transformCss(content,'translateY',point);
                };
            },20);
        };
    };
})(window);

;(function () {
    'use strict';

    var $form_add_task = $('.add-task'),//获取到添加任务dom
        task_list = [],                 //定义数组存储数据列表 每一个数组项是一条任务 一条任务是一个对象
        $task_detail = $('.task-detail'),//dom元素div
        $task_detail_mask = $('.task-detail-mask'),
        $delete_task,
        $detail_task, // dom元素详情按钮
        current_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input,
        $checkbox_complete;

    init();

    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click',hide_task_detail);
    // 阻止事件冒泡
    $task_detail.on('click',function (event) {
        event.stopPropagation();
    });
    /*定义的函数*/
    // 初始化task_list数组
    function init() {
        task_list = store.get('task_list') || [];
        if(task_list.length) {
            render_task_list()
        }
        task_remind_check();
    }
    // 添加新任务按钮事件处理函数
    function task_remind_check() {
        var current_timestamp;
        var itl = setInterval(function () {
            for (var i=0; i<task_list.length; i++) {
                var item = get(i),
                    task_timestamp;
                if (!item || !item.remind_date || item.informed) {
                    continue;
                }
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp-task_timestamp>=1) {
                    update_task(i,{informed:true});
                    notify();
                }
            }
        },300);
    }
    function notify() {
        console.log("1");
    }
    function on_add_task_form_submit(e) {
        var new_task = {}; //定义对象存储添加的任务
        //禁用默认行为
        e.preventDefault();
        //获取新task的值
        new_task.content = $(this).find('input[name=content]').val();
        //没有内容则不继续执行
        if(!new_task.content) {
            return;
        }
        // 存入新task
        if (add_task(new_task)) {//添加任务成功，则要更新dom
            $(this).find('input[name=content]').val(' ');
        }
    }
    //添加新任务到localStroage中
    function add_task(new_task) {
        //将新task放入task_list
        task_list.push(new_task);
        //更新localStorage
        refresh_task_list();
        return true;
    }
    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }
    function delete_task(index) {
        if(index === undefined || !task_list[index])
            return;
        delete task_list[index];
        refresh_task_list();
    }
    //渲染所有任务
    function render_task_list() {
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for (var i=0; i<task_list.length; i++) {
            var item = task_list[i];
            if (item && item.complete) {
                complete_items[i] = item;
            }else {
                var $task = render_task_tpl(item,i);
                //在dom后面append新的内容显示
                $task_list.prepend($task);
            }
        }//for结束
        for (var i=0; i<complete_items.length; i++) {
            var $task = render_task_tpl(complete_items[i],i);
            if(!$task) {
                continue;
            }
            //在dom后面append新的内容显示
            $task.addClass('completed');
            $task_list.append($task);
        }
        //必须要在渲染成功之后才能获取到所有的删除按钮
        //获取到所有删除按钮
        $delete_task = $('.action.delete');
        //获取到所有详情按钮
        $detail_task = $('.action.detail');
        $checkbox_complete = $('.task-list .complete[type=checkbox]');

        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }
    // 渲染单条任务
    function render_task_tpl(data,index) {
        if(!data || !index) return;
        var list_item_tpl = '<div class="task-item" data-index="'+index+'">\n' +
            '<sapn><input class="complete" type="checkbox" '+(data.complete ? 'checked' : '')+'></sapn>\n' +
            '<span class="task-content">'+data.content+'</span>\n' +
            '<span class="fr">\n'+
            '<span class="action delete">删除</span>\n' +
            '<span class="action detail">详情</span>\n' +
            '</span>\n'+
            '</div>';
        return $(list_item_tpl);
    }
    // 查找并监听所有删除按钮的点击事件
    function listen_task_delete() {
        $delete_task.on('click',function () {
            var $this = $(this);
            // 选中要删除的每条
            var $item = $this.parent().parent();
            var index = $item.data('index');
            // console.log($item.data('index'));
            var tmp = confirm('确定删除吗？');
            tmp ? delete_task(index) : null;
        });
    }
    function listen_task_detail() {
        var index;
        // 查找并监听所有详情按钮的点击事件
        $('.task-item').on('dblclick',function () {
            index = $(this).data('index');
            show_task_detail(index);
        });
        $detail_task.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            index = $item.data('index');
            show_task_detail(index);
        });
    }
    function show_task_detail(index) {
        // 生成详情模板
        render_task_detail(index);
        current_index = index;
        // 显示详情模板（默认不显示）
        $task_detail.show();
        $task_detail_mask.show();
    }
    function hide_task_detail(event) {
        $task_detail_mask.hide();
    }
    // 渲染指定task的详细信息
    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) {
            return;
        }
        var item = task_list[index];
        var tpl =
            '<form>\n' +
            '   <div class="content">'+item.content+'</div>\n' +
            '   <div><input style="display: none" type="text" name="content" value="'+item.content+'"></div>\n'+
            '   <div>\n' +
            '       <div class="desc">\n' +
            '           <textarea name="desc">'+(item.desc || '')+'</textarea>\n' +
            '       </div>\n' +
            '   </div>\n' +
            '   <div class="remind">\n' +
            '       <label>提醒时间</label>'+
            '       <input class="datetime" type="text" name="remind_date" value="'+(item.remind_date || '')+'">\n' +
            '   </div>\n' +
            '   <div><button type="submit">更新</button></div>\n'+
            '</form>';
        $task_detail.html('');
        $task_detail.html(tpl);
        $update_form = $task_detail.find('form');
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');
        $('.datetime').datetimepicker();
        $task_detail_content.on('dblclick', function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });
        $update_form.on('submit',function (event) {
            // 阻止表单提交（默认事件）
            event.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index,data);
            // 更新完后自动关闭详情弹窗
            hide_task_detail();
        });
    }
    function update_task(index, data) {
        if (!index || !task_list[index]) {
            return;
        }
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }
    // 监听完成task事件
    function listen_checkbox_complete() {
        $checkbox_complete.on('click',function () {
            var $this = $(this);
            // console.log($this);
            // var is_complete = $this.is(':checked');
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if (item.complete) {
                update_task(index, {complete: false});
            }
            else {
                update_task(index, {complete: true});
            }
        });
    }
    function get(index) {
        return store.get('task_list')[index];
    }
})();

function init() {

    const app = new Vue({
        el:'#app',
        created: function() {
            this.todos = localStorageHandler.fetch();
        },
        data:{
            options:[{value:-1,label:'전체'},
                     {value:0, label:'완료'},
                     {value:1,label:'진행중'}],
            current:-1,
            todos:[],
        },
        watch:{
            todos: {
                handler:function(todos) {
                    console.log("Save to localStorage");
                    localStorageHandler.reindexing();
                    localStorageHandler.save(todos);
                },
                deep:true
            }
        },
        methods:{
            doChangeState:function(item){
                item.state = (item.state==1? 0: 1);
            },
            doRemove:function(item){
                const index = this.todos.indexOf(item);
                this.todos.splice(index,1);
            },
            doAdd:function() {
                let comment = this.$refs.comment;
                if (!comment.value) {
                    return;
                }
                const new_data = {
                    id:++localStorageHandler.uid,
                    comment:comment.value,
                    state:1
                }
                this.todos.push(new_data);
                comment.value = '';

            }
        },
        computed:{
            computedTodos:function() {
                return this.todos.filter((el)=>{
                    return this.current < 0 ? true: el.state == this.current;
                });
            },
            labels:function(){
                return this.options.reduce(function(a,b){
                    return Object.assign(a, {[b.value]:b.label});
                },{});
            }
        }
    });
}
const KEY = "LOCAL_STORAGE";
var localStorageHandler = {
    uid:0,
    todo:'',
    init:function(){
        data = [{id:1,
            state:1,
            comment:'hello'},
            {id:2,
                state:0,
                comment:'hello2'}];
        this.save(data);
    },
    fetch:function(){
        const tmp = localStorage.getItem(KEY) || '[]';
        this.todos = JSON.parse(tmp);
        if (this.todos && this.todos.length==0) {
            this.init();
            this.todos = JSON.parse(localStorage.getItem(KEY));
        }
        this.reindexing();
        localStorageHandler.uid = this.todos.length;
        return this.todos;
    },
    reindexing:function() {
        this.todos.forEach((item, index)=>{
            item.id = index+1;
        });
    },
    save:function(data){
        localStorage.setItem(KEY, JSON.stringify(data));
    }
}
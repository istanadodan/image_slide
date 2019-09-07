const basedir = "webapp/";
const image_name = "test.jpg";

function init() {

    Vue.component('gameResult',{
        props:['home','away'],
        template:"<div>Home-Away:3-1{{home}} {{away}}</div>"
    })

    let testData2 = {
        win:true,
        name:["test1.jpg","test2.jpg"]
    }
    const app = new Vue(
        {
            el:"#app2",
            data:{
                album:testData2,
                param:'{"name":"test1.jpg"}',
                path:"",
                url:"/album/",
                result:""
            },
            methods:{
                post:   function(){
                        config = {};
                        param =  JSON.parse(this.param);
                        axios.post(this.url+this.result,param,config).then(function(res){
                            console.log(res);
                            app.path = res.data[0];
                            
                        });
                }
            }
        });
        app.result=app.album.name[0];
        app.path = 'webapp/' + app.result;
}

function getUrl(filename) {
    return basedir + filename + "\\" + image_name;
}
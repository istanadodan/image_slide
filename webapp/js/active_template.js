
function init() {
    Vue.component('async-component', function (resolve, reject) {
        axios.get('webapp/html/insert.html')
                .then(
                     function (resp) {
            // var parser = new DOMParser();
            // var doc = parser.parseFromString(resp.data, "text/html");
            resolve({template:"'"+resp.data.replace('\n','')+"'"});
        });
    
    });
  
    // Vue.component('async1',{
    //     template:'<h1>test</h1>'
    // });

    let app = new Vue({
        el:'#app'
    });
}
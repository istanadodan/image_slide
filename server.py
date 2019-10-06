import os
from flask import Flask, jsonify,redirect,render_template,request,url_for,Response,send_from_directory,send_file
import server as svr
import service as sl

app = svr.create_app(__name__)
baseDir = svr.root_path_pics
frd_dir =svr.face_recog_data_path
# 로그설정파일을 서버기동폴더에 위치
mylog = svr.get_logger(app.root_path).getLogger(__name__)

@app.route("/")
def index():
    return send_from_directory('webapp/html','index.html')
    
@app.route('/memo')
def main():
    mylog.info("Memo main activated")
    return send_from_directory('webapp/html','app_memo_excel.html')

@app.route('/memo/articles',methods=['GET'])
def memo_articles():
    memo = sl.Memo()
    data = memo.getAllData()
    cat = memo.getCategory()
    # 사용한 ws를 클리어해서 데이터갱신이 되도록 한다.
    memo.clear()
    ret = {'cat':cat, 'data':data}
    return jsonify(ret)
    
@app.route('/memo/add',methods=['POST'])
def memo_add():

    data = request.form;
    mylog.debug("form data:{}".format(data))
    word = data.getlist('word')[0]
    meaning =data.getlist('meaning')[0]
    category = data.getlist('category')[0]

    main = [category, word, meaning] 
    examples = data.getlist('examples')
    keywords = data.getlist('keywords')

    memo = sl.Memo()
    memo.add({'main':main,'examples':examples,'keywords':keywords})
    memo.clear()

    mylog.debug("data:%s"%data);
    
    return redirect(url_for('main'))

@app.route('/memo/updateAll', methods=['POST'])
def updateAll():
    import json
    # data=>{add:[{index:10,examples:['a','b'],keywords:['c'],{}],
    #  mod:[{index:10,category:'word1',examples:{index:[2],data:['10']}},{}]}    
    # main시트는 추가는 없으며, examples와 keywords에는 추가가 있을수있다
    data = json.loads(request.data)
    mylog.debug(data)

    memo = sl.Memo()
    memo.removeElement(data['del'])
    memo.addElement(data['add'])
    memo.updateElement(data['mod'])
    memo.add(data['new_'])
    memo.clear()

    return redirect(url_for('memo_articles'))

@app.route('/memo/removeArticle', methods=['POST'])
def removeArticle():
    import json
    # data=>{index:1}
    data = json.loads(request.data)
    mylog.debug(data)

    memo = sl.Memo()
    memo.remove(data)
    memo.clear()

    return redirect(url_for('memo_articles'))

@app.route('/slide')
def main_slide():
    mylog.info("Slide main activated")
    # return send_from_directory('webapp/html','todo.html')
    # return render_template('album-page.html')
    return send_from_directory('webapp/html','slide_home.html')

@app.route('/album', methods=['GET'])
def getFolders():
    # 문자열그대로인상태의 자료를 받는다.
    req = request.args.get('book')
    path = req
    mylog.debug("req %s" %(request))
    mylog.debug("req data %s" %(req))
    # 해당 폴더내 파일을 구하기위해 우선 폴더의 풀패스를 파악한다.
    dir_path = os.path.join(baseDir, path)

    folders = [file for file in os.listdir(dir_path) if os.path.isdir(os.path.join(dir_path,file))]
    mylog.debug("res %s"%(folders))
    return jsonify(folders)

@app.route('/album', methods=['POST'])
def getFiles():
    
    #request를 입력받아, getOptions('옵션명')를 갖는다.
    flow = sl.MyRequestHandler(request, baseDir, reqFileHandling=True)
    
    #수정데이터를 getData(path, list)로 입력받는다.

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )

@app.route('/album/update', methods=['POST'])
def update():

    #request를 입력받아, getOptions('옵션명')를 갖는다.
    flow = sl.MyRequestHandler(request, baseDir,reqFileHandling=True)
    
    #수정데이터를 getData(path, list)로 입력받는다.
    # 'data'로써 받은 자료를 업데이트하는 것으로 정함.
    flow.update()
#     flow.update2()

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )

@app.route('/album/remove', methods=['POST'])
def remove():
    #request를 입력받아, getOptions('옵션명')를 갖는다.
    flow = sl.MyRequestHandler(request, baseDir,reqFileHandling=True)
    
    #수정데이터를 getData(path, list)로 입력받는다.
    # 'data'로써 받은 자료를 업데이트하는 것으로 정함.
    flow.remove()

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )    

@app.route('/image/recognition', methods=['POST'])
def doFaceRecognition():
    #request를 입력받아, getOptions('옵션명')를 갖는다.
    #안면인식데이터 learning_data_path='file'
    #scale_factor='scale_factor'
    flow = sl.MyRequestHandler(request, baseDir, learning_data='file', scale_factor='scale_factor') 
    
    #수정데이터를 getData(path, list)로 입력받는다.
    # 파라미터로 처리 이미지목록, 인식데이터명, 그리고 스케일팩터
    base_dir = flow.full_path
    data = flow.data
    learning_data = os.path.join(frd_dir, flow.file)
    scale_factor = flow.scale_factor

    cascader = sl.Cascader(base_dir, learning_data, data, scale_factor)
    result_list = cascader.getList();
    _log('cascader', result_list)
    flow.updateFrom(result_list)

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )

@app.route('/image/edit_f01', methods=['POST'])
def doImageEditF01():
    # 이미지편집기능 1 rotate@params={quality_level}
    #request를 입력받아, getOptions('옵션명')를 갖는다.
    flow = sl.MyRequestHandler(request, baseDir,edit="option")
    
    #수정데이터를 getData(path, list)로 입력받는다.
    # 'data'로써 받은 자료를 업데이트하는 것으로 정함.
    args = flow.args('full_path','data','option')
    if01 = sl.ImageEdit( *args )
    result_list = if01.getList()
    
    # 편집사진을 갱신한다.
    flow.append(result_list)

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )

@app.route('/image/edit_f02', methods=['POST'])
def doImageEditF02():
    # 이미지편집기능 2 quality@params={quality_level}
    flow = sl.MyRequestHandler(request, baseDir, arg='option')
    
    # tuple('`flow.full_path','flow.data','flow.option') 반환받음
    args = flow.args('full_path','data','option')
    # 입력변수와 반환변수의 값이 상이하므로 편의상 순서대로 전달하는 튜플로 함.
    # (입력값 dir_path, 반환값 full_path)
    # tuple을 풀어서 넣기위해 *를 추가함. **는 dict타입?
    if01 = sl.ImageEdit(*args)
    result_list = if01.getList();
    
    # 편집사진에 대해 추가한다.
    flow.append(result_list)

    #화면에 보낼 데이타를 file_list로 반환한다.
    file_list = flow.file_list

    return jsonify( file_list )

def _log(title, msg):
        print("[{0}]: {1}".format(title, msg))

if __name__ == '__main__':
    # cur_path = os.path.join( os.path.dirname(__file__) , "logging.config")        
    try:
        mylog.info("server started.....")
        app.run(debug=True)
    except Exception as e:
        mylog.error(e)
        mylog.flush()
import service.FileInfoService as fsrv
import os, logging
from utils import auto_log
_logger = logging.getLogger(__name__)
d = { 'moduleName':__name__}

# def auto_log(arg0):
#     def logging(ret_value, *args, module=__name__):
#         # 반환치가 없는 함수는 입력값을 출력
#         d = {'moduleName':module.__name__}
#         if not ret_value:
#             for arg in args[1:]:
#                 _logger.debug("[인수]%s"% str(arg), extra=d)
#         else:
#             _logger.debug("[반환]%s"% ret_value, extra=d)

#     # 호출함수명이 래퍼로 변경되는 것을 방지 
#     def type1(func):
#         @wraps(func)
#         def wrap_func(*args, **kargs):
#             message = arg0
#             # 반환치, 로그출력값, 모듈명
#             logging(message, *args, module=func)
#             return func(*args, **kargs)
#         return wrap_func
        
#     @wraps(arg0)
#     def type2(*args, **kargs):
#         ret = arg0(*args, **kargs)
#         # 반환치, 인수값, 모듈명
#         logging(ret, *args, module=arg0)
#         return ret

#     if hasattr(arg0,'__call__'):
#         return type2
#     else:
#         return type1


class MyRequestHandler:
    # karg['reqFileHandling'] True/False 파일목록처리 수행여부    
    def __init__(self, req, dir, **karg):
        self.req = req
        self.dir = dir
        self.options = karg
        self._initialize()
        self._make_log()
        
        if not 'reqFileHandling' in self.options or self.options['reqFileHandling']:
            self._prepare()
            # self._log("file_list", self.file_list)
    
    def _make_log(self):
        _logger.info("request:"+str(self.req),extra=d)
        _logger.info("full path:"+str(self.full_path),extra=d)
        _logger.info("options:"+str(self.options),extra=d)

    def _initialize(self):
        self.err_msg =""
        self.full_path = ""
        self.file_list=[]
        self.data=[]

        req = self.req.json
        bookName, albumName = req.get('book',''), req.get('album','')         
        if bookName =='':
            self.err_msg = "book값 Null"
            return

        path = bookName
        if albumName !='':
            path = os.path.join(path, albumName)

        self.full_path = os.path.join(self.dir, path)
        self.data = req.get('data',[])

        for key, value in self.options.items():
            if type(value)!=bool:
                # 옵션값의 값을 필드명으로 등록하며, 
                # req에서 그 이름으로 등록된 값을 가져와 대입.
                setattr(self, value, req.get(value,''))
                _logger.debug("옵션값 %s=> 필드값 %s"% (value, req.get(value,'')), extra=d )

        # 파일처리모듈을 등록한다.
        self.file_info = fsrv.FileInfo(self.full_path)

    @auto_log(__name__)
    def update(self):
        self.file_info.update(self.data)
    
    def update2(self):
        self.file_info.update2(self.data)
        
    @auto_log(__name__)
    def updateFrom(self, data):
        self.data = data
        self.update()

    @auto_log(__name__)
    def append(self, data):
        self.file_info.append(data)

    @auto_log(__name__)
    def remove(self):
        self.file_info.remove(self.data)

    def _prepare(self):
        # 로컬에 저장된 자료에서 파일에 대한 정보를 찾는다. 없으면 추가한다.
        # fileInfo에 파일을 넣고 관련정보를 얻는다.
        # HQ:high qualit, KO:얼굴사진, ME:memo
        # {name:filename, HQ:false, KO:false, ME:false, place:'', memo:'', KW:[]}    
        # TODO:fileInfo에 refresh기능(강제 새로 업데이트)추가
        self.file_list = self.file_info.getList()

    def args(self, *args):
        ret = list()
        for field_name in args:
            ret.append( getattr(self,field_name) )
        return tuple(ret)
    @auto_log(__name__)
    def kargs(self, *args):
        ret = dict()
        for field_name in args:
            ret[field_name] = getattr(self,field_name)

        return ret
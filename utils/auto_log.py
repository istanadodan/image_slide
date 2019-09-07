from functools import wraps
import logging

def getLogger(name):
    print("name   %20s" % name)
    return logging.getLogger(name)

def auto_log(arg0):
    def writelog(ret_value, *args, module_name =__name__):
        # logger설정
        logger = logging.getLogger(module_name)

        # 로그변수 설정
        d = {'moduleName':module_name}

        if not ret_value:
            for arg in args[1:]:
                logger.debug("[인수]%s"% str(arg), extra=d)
        else:
            logger.debug("[반환]%s"% ret_value, extra=d)

    # 호출함수명이 래퍼로 변경되는 것을 방지 
    def type1(func):
        @wraps(func)
        def wrap_func(*args, **kargs):
            module_name = arg0
            # 반환치, 로그출력값, 모듈명
            writelog(None, *args, module_name=module_name)
            return func(*args, **kargs)
        return wrap_func
        
    @wraps(arg0)
    def type2(*args, **kargs):
        ret = arg0(*args, **kargs)
        # 반환치, 인수값, 모듈명
        # logger명 없음
        writelog(ret, *args, module_name=arg0.__name__)
        return ret

    if hasattr(arg0,'__call__'):
        return type2
    else:
        return type1
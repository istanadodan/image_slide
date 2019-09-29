# from .config import setting
import configparser
import os
import logging.config
import logging, json

config = configparser.ConfigParser()
path = os.path.join(os.path.abspath(os.path.dirname(__file__)),'config.ini')
config.read(path, encoding='utf-8')

static_folder = config.get('static','static_folder').split(',')
root_path_pics = config.get('static','root_path_pics')
face_recog_data_path = config.get('static', 'face_recog_data_path')

def get_logger(root_path):
    #logger설정, DEBUG레벨 이상을 출력한다. 즉 모두 레벨로그를 출력한다.
    # 레벨: DEBUG < INFO < WARNING < ERROR <CRITICAL
    # logging.basicConfig(level="DEBUG", format="%(asctime)s %(levelname)s %(message)s")    
    file_path = os.path.join( os.path.dirname(__file__) , "logging.config")

    with open(file_path, "rt", encoding="utf-8") as f:
        config = json.load(f)
        logging.config.dictConfig(config)

    return logging

def create_app(module_name):
    from flask import Flask
    from flask_multistatic import MultiStaticFlask
    from flask_cors import CORS, cross_origin

    # 서버내 폴더위치지정 외, 타 폴더지정시 스테틱폴더옵션을 사용한다.
    # js,css등은 서버내 폴더내 위치시켜 /static/js등으로 지정할 수 있다.
    app = MultiStaticFlask(module_name)

    # MultistaticFlask
    # app.static_folder=setting.static_folder
    app.static_folder=static_folder

    # cross origin 
    CORS(app)

    return app
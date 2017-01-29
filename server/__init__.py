# Import flask and template operators
# import logging
import os
# import sys

from flask import Flask, render_template
from flask_babel import Babel
from flask_bcrypt import Bcrypt
from flask_cache import Cache

app = Flask(__name__)
# app.logger.addHandler(logging.StreamHandler(sys.stdout))
# app.logger.setLevel(logging.DEBUG)

bcrypt = Bcrypt()

app.secret_key = "\x9b\x00\xdf\xc8xb_\xa2U\r\x8cp\xfas'y\xc32>\xe6f\xb8\x03*"
cache = Cache(app, config={'CACHE_TYPE': 'filesystem', 'CACHE_DIR': '_flask_cache_tmp_'})
babel = Babel(app)


@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


# Import a module / component using its blueprint handler variable (mod_auth)
from server.mod_api.controller import mod_api as mod_api
from server.mod_client.controller import mod_client as mod_client

# Register blueprint(s)
app.register_blueprint(mod_api)
app.register_blueprint(mod_client)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '0'

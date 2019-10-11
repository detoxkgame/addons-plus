# -*- coding: utf-8 -*-

import time
import logging
import werkzeug.utils
from werkzeug.exceptions import BadRequest
from datetime import datetime, date
from odoo.addons.website.controllers.main import Website
from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.http import request
from odoo import http, fields,  _
from odoo.addons.auth_signup.models.res_partner import SignupError, now
_logger = logging.getLogger(__name__)


# class Skit_Login(Website):
#   
#     @http.route('/website/signup', type='http',
#                 auth='public',
#                 website=True)
#     def signup_login(self, *args, **kw):
#         """
#         parent login
#         """
#         return request.render('skit_slide.skit_parent_login')
# -*- coding: utf-8 -*-

import json
import base64
import logging
import werkzeug

from odoo import http, _
from odoo.exceptions import AccessError, UserError
from odoo.http import request
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.website.models.ir_http import sitemap_qs2dom
from datetime import date, datetime, timedelta
from odoo.addons.web.controllers.main import ensure_db, Home

_logger = logging.getLogger(__name__)


class SlideAuthHome(Home):

    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        response = super(SlideAuthHome, self).web_login(*args, **kw)
        if request.params.get('login_success'):
            user = request.env['res.users'].sudo().browse(int(request.env.uid))
            if(user.partner_id.isstudent or user.partner_id.isparent):
                return request.redirect("/grades-subjects")
        return response

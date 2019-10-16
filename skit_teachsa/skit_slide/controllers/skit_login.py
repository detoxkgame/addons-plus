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
from odoo.addons.web.controllers.main import ensure_db, Home
_logger = logging.getLogger(__name__)
from odoo.exceptions import UserError
from odoo.http import request


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
class SkitAuthSignupHome(Home):

        def do_signup(self, qcontext):
            """ Shared helper that creates a res.partner out of a token """
            values = { key: qcontext.get(key) for key in ('login', 'name', 'password','sur_name','age','mobile','school','grade','stud_dob_date','stud_dob_month','stud_dob_year','gender') }
            print("passvalue",values)
            if not values:
                raise UserError(_("The form was not properly filled in."))
            if values.get('password') != qcontext.get('confirm_password'):
                raise UserError(_("Passwords do not match; please retype them."))
            supported_langs = [lang['code'] for lang in request.env['res.lang'].sudo().search_read([], ['code'])]
            if request.lang in supported_langs:
                values['lang'] = request.lang
            self._signup_with_values(qcontext.get('token'), values)
            request.env.cr.commit()

        @http.route('/web/signup', type='http', auth='public', website=True, sitemap=False)
        def web_auth_signup(self, *args, **kw):
            qcontext = self.get_auth_signup_qcontext()
            if not qcontext.get('token') and not qcontext.get('signup_enabled'):
                raise werkzeug.exceptions.NotFound()
            if 'error' not in qcontext and request.httprequest.method == 'POST':
                try:
                    self.do_signup(qcontext)
                    # Send an account creation confirmation email
                    if qcontext.get('token'):
                        user_sudo = request.env['res.users'].sudo().search([('login', '=', qcontext.get('login'))])
                        template = request.env.ref('auth_signup.mail_template_user_signup_account_created', raise_if_not_found=False)
                        if user_sudo and template:
                            template.sudo().with_context(
                                lang=user_sudo.lang,
                                auth_login=werkzeug.url_encode({'auth_login': user_sudo.email}),
                            ).send_mail(user_sudo.id, force_send=True)
                    return super(AuthSignupHome, self).web_login(*args, **kw)
                except UserError as e:
                    qcontext['error'] = e.name or e.value
                except (SignupError, AssertionError) as e:
                    if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
                        qcontext["error"] = _("Another user is already registered using this email address.")
                    else:
                        _logger.error("%s", e)
                        qcontext['error'] = _("Could not create a new account.")
            skit_student_grade_detail = request.env['skit.student.grade.category']
            qcontext['skit_student_grade_detail'] = skit_student_grade_detail
            countries = request.env['res.country'].sudo().search([])
            qcontext['country_id'] = countries
            response = request.render('auth_signup.signup', qcontext)
            response.headers['X-Frame-Options'] = 'DENY'
            return response

        @http.route('/website/parent_form', type='http', auth='public', website=True, sitemap=False)
        def get_parentform_values(self, *args, **kw):
            if request.httprequest.method == 'POST':
                parent_name = request.params.get('name')
                contact_no = request.params.get('contact_no')
                email = request.params.get('email')
                password = request.params.get('password')
                confirm_password = request.params.get('confirm_password')
                street = request.params.get('street')
                city = request.params.get('city')
                pincode = request.params.get('pincode')
                country = request.params.get('country_id')
                vals = {
                        'name':parent_name,
                        'login':email,
                        'password':password,
                        }
                newuser = request.env['res.users'].sudo().create(vals)
                res_partner =  newuser.partner_id
                res_partner.update({'name':parent_name,
                                'mobile':contact_no,
                                'email':email,
                                'street':street,
                                'city':city,
                                'zip':pincode,
                                'country_id':country,
                                'isparent':True,
                                })


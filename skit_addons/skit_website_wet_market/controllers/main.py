
import logging
import werkzeug
import odoo
import math, random

from odoo import fields, http, _
from odoo.exceptions import AccessError, MissingError
from odoo.http import request
from odoo.addons.portal.controllers.portal import CustomerPortal, pager as portal_pager, get_records_pager
from werkzeug.exceptions import Forbidden, NotFound
from odoo.addons.website.controllers.main import QueryURL
from odoo.addons.sale.controllers.product_configurator import ProductConfiguratorController
from odoo.addons.web.controllers.main import ensure_db, Home
from odoo.exceptions import UserError
from odoo.addons.auth_signup.models.res_users import SignupError
from odoo.tools import consteq

_logger = logging.getLogger(__name__)


class WetAuthSignupHome(Home):

    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        if(request.session.get('customer_url')):
            kw['customer'] = True
        if(kw.get('customer')):
            request.session['customer_url'] = True

        if (kw.get('login') and kw.get('customer')):
            user_sudo = request.env['res.users'].sudo().search([('login', '=', kw.get('login'))])
            wet_otp = request.env['wet.otp.verification'].sudo().search([('mobile', '=', kw.get('login'))])
            if wet_otp:
                kw['otp'] = wet_otp.otp
            else:
                digits = "0123456789"
                otp_no = ""
                for i in range(6):
                    otp_no += digits[math.floor(random.random() * 10)]
                wet_otp = request.env['wet.otp.verification'].sudo().create(
                    {'mobile': kw.get('login'),
                     'email': user_sudo.email,
                     'otp': otp_no})
                template = request.env.ref('skit_website_wet_market.wet_otp_verification', raise_if_not_found=False)
                mail_template = request.env['mail.template'].sudo().browse(template.id)
                mail_template.write({
                    'email_to': user_sudo.email
                })
                mail_id = mail_template.send_mail(wet_otp.id, force_send=True)
                mail_mail_obj = request.env['mail.mail'].sudo().search(
                        [('id', '=', mail_id)]
                        )
                mail_mail_obj.send()
                mail_mail = request.env['mail.mail'].sudo().search(
                        [('id', '=', mail_mail_obj.id)]
                        )

        response = super(WetAuthSignupHome, self).web_login(*args, **kw)
        response.qcontext.update(self.get_auth_signup_config())
        if request.httprequest.method == 'GET' and request.session.uid and request.params.get('redirect'):
            # Redirect if already logged in and redirect param is present
            return http.redirect_with_hash(request.params.get('redirect'))
        return response

    @http.route('/web/signup', type='http', auth='public', website=True, sitemap=False)
    def web_auth_signup(self, *args, **kw):
        if(request.session.get('customer_url')):
            kw['customer'] = True
        if (kw.get('login') and kw.get('customer')):
            kw['password'] = kw.get('login')
            kw['confirm_password'] = kw.get('login')
        qcontext = self.get_auth_signup_qcontext()
        if(kw.get('customer')):
            qcontext['show_customer'] = True
            if(kw.get('login') and (not kw.get('otp'))):
                digits = "0123456789"
                otp_no = ""
                for i in range(6):
                    otp_no += digits[math.floor(random.random() * 10)]
                wet_otp = request.env['wet.otp.verification'].sudo().create(
                        {'mobile': kw.get('login'),
                         'email': kw.get('email_address'),
                         'otp': otp_no})
                template = request.env.ref('skit_website_wet_market.wet_otp_verification', raise_if_not_found=False)
                mail_template = request.env['mail.template'].sudo().browse(template.id)
                mail_template.write({
                    'email_to': kw.get('email_address')
                })
                mail_id = mail_template.send_mail(wet_otp.id, force_send=True)
                mail_mail_obj = request.env['mail.mail'].sudo().search(
                            [('id', '=', mail_id)]
                            )
                mail_mail_obj.send()
                mail_mail = request.env['mail.mail'].sudo().search(
                            [('id', '=', mail_mail_obj.id)]
                            )
                qcontext['show_otp'] = "otp"
                qcontext['otp_message'] = "OTP has been sent to your email address"
                qcontext['error'] = "OTP will expire in 10mins"
                response = request.render('auth_signup.signup', qcontext)
                response.headers['X-Frame-Options'] = 'DENY'
                return response
            else:
                if kw.get('otp'):
                    wet_otp = request.env['wet.otp.verification'].sudo().search([
                        ('mobile', '=', kw.get('login')),
                        ('otp', '=', kw.get('otp'))])
                    if not wet_otp:
                        qcontext['show_otp'] = "otp"
                        qcontext['otp_message'] = "OTP has been sent to your email address"
                        qcontext['error'] = "OTP will expire in 10mins"
                        response = request.render('auth_signup.signup', qcontext)
                        response.headers['X-Frame-Options'] = 'DENY'
                        return response

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
                return super(WetAuthSignupHome, self).web_login(*args, **kw)
            except UserError as e:
                qcontext['error'] = e.name or e.value
            except (SignupError, AssertionError) as e:
                if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
                    qcontext["error"] = _("Another user is already registered using this email address.")
                else:
                    _logger.error("%s", e)
                    qcontext['error'] = _("Could not create a new account.")

        response = request.render('auth_signup.signup', qcontext)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    def get_auth_signup_qcontext(self):
        """ Shared helper returning the rendering context for signup and reset password """
        qcontext = request.params.copy()
        qcontext.update(self.get_auth_signup_config())
        if (qcontext.get('login') and qcontext.get('customer')):
            qcontext['password'] = qcontext.get('login')
            qcontext['confirm_password'] = qcontext.get('login')
        if not qcontext.get('token') and request.session.get('auth_signup_token'):
            qcontext['token'] = request.session.get('auth_signup_token')
        if qcontext.get('token'):
            try:
                # retrieve the user info (name, login or email) corresponding to a signup token
                token_infos = request.env['res.partner'].sudo().signup_retrieve_info(qcontext.get('token'))
                for k, v in token_infos.items():
                    qcontext.setdefault(k, v)
            except:
                qcontext['error'] = _("Invalid signup token")
                qcontext['invalid_token'] = True
        return qcontext

    def do_signup(self, qcontext):
        """ Shared helper that creates a res.partner out of a token """
        values = { key: qcontext.get(key) for key in ('login', 'name', 'password', 'email_address') }
        if not values:
            raise UserError(_("The form was not properly filled in."))
        if values.get('password') != qcontext.get('confirm_password'):
            raise UserError(_("Passwords do not match; please retype them."))
        supported_langs = [lang['code'] for lang in request.env['res.lang'].sudo().search_read([], ['code'])]
        if request.lang in supported_langs:
            values['lang'] = request.lang
        self._signup_with_values(qcontext.get('token'), values)
        request.env.cr.commit()


class WebsiteCustomerPortal(CustomerPortal):

    @http.route(['/sorder/<int:order_id>'], type='json', auth="public", website=True)
    def update_order_status(self, order_id=None,  **post):
        sale_order = request.env['sale.order'].search([('id', '=', order_id)])
        return sale_order.state

    def _prepare_portal_layout_values(self):
        values = super(WebsiteCustomerPortal, self)._prepare_portal_layout_values()
        partner = request.env.user.partner_id

        SaleOrder = request.env['sale.order']
        quotation_count = SaleOrder.sudo().search_count([
            ('partner_id', '=', partner.id),
            ('state', '=', 'sent')
        ])
        order_count = SaleOrder.sudo().search_count([
            ('partner_id', '=', partner.id),
            ('state', 'not in', ['draft', 'sent', 'cancel'])
        ])
        invoice_count = request.env['account.invoice'].sudo().search_count([
            ('partner_id', '=', partner.id)])
        values['invoice_count'] = invoice_count

        values.update({
            'quotation_count': quotation_count,
            'order_count': order_count,
        })
        return values

    @http.route(['/my/quotes', '/my/quotes/page/<int:page>'], type='http', auth="user", website=True)
    def portal_my_quotes(self, page=1, date_begin=None, date_end=None, sortby=None, **kw):
        values = self._prepare_portal_layout_values()
        partner = request.env.user.partner_id
        SaleOrder = request.env['sale.order']

        domain = [
            ('partner_id', '=', partner.id),
            ('state', 'in', ['sent', 'cancel'])
        ]

        searchbar_sortings = {
            'date': {'label': _('Order Date'), 'order': 'date_order desc'},
            'name': {'label': _('Reference'), 'order': 'name'},
            'stage': {'label': _('Stage'), 'order': 'state'},
        }

        # default sortby order
        if not sortby:
            sortby = 'date'
        sort_order = searchbar_sortings[sortby]['order']

        archive_groups = self._get_archive_groups('sale.order', domain)
        if date_begin and date_end:
            domain += [('create_date', '>', date_begin), ('create_date', '<=', date_end)]

        # count for pager
        quotation_count = SaleOrder.sudo().search_count(domain)
        # make pager
        pager = portal_pager(
            url="/my/quotes",
            url_args={'date_begin': date_begin, 'date_end': date_end, 'sortby': sortby},
            total=quotation_count,
            page=page,
            step=self._items_per_page
        )
        # search the count to display, according to the pager data
        quotations = SaleOrder.sudo().search(domain, order=sort_order, limit=self._items_per_page, offset=pager['offset'])
        request.session['my_quotations_history'] = quotations.ids[:100]

        values.update({
            'date': date_begin,
            'quotations': quotations.sudo(),
            'page_name': 'quote',
            'pager': pager,
            'archive_groups': archive_groups,
            'default_url': '/my/quotes',
            'searchbar_sortings': searchbar_sortings,
            'sortby': sortby,
        })
        return request.render("sale.portal_my_quotations", values)

    @http.route(['/my/orders', '/my/orders/page/<int:page>'], type='http', auth="user", website=True)
    def portal_my_orders(self, page=1, date_begin=None, date_end=None, sortby=None, **kw):
        values = self._prepare_portal_layout_values()
        partner = request.env.user.partner_id
        SaleOrder = request.env['sale.order']

        domain = [
            ('message_partner_ids', 'child_of', [partner.commercial_partner_id.id]),
            ('state', 'not in', ['draft', 'sent', 'cancel'])
        ]

        searchbar_sortings = {
            'date': {'label': _('Order Date'), 'order': 'date_order desc'},
            'name': {'label': _('Reference'), 'order': 'name'},
            'stage': {'label': _('Stage'), 'order': 'state'},
        }
        # default sortby order
        if not sortby:
            sortby = 'date'
        sort_order = searchbar_sortings[sortby]['order']

        archive_groups = self._get_archive_groups('sale.order', domain)
        if date_begin and date_end:
            domain += [('create_date', '>', date_begin), ('create_date', '<=', date_end)]

        # count for pager
        order_count = SaleOrder.search_count(domain)
        # pager
        pager = portal_pager(
            url="/my/orders",
            url_args={'date_begin': date_begin, 'date_end': date_end, 'sortby': sortby},
            total=order_count,
            page=page,
            step=self._items_per_page
        )
        # content according to pager and archive selected
        orders = SaleOrder.search(domain, order=sort_order, limit=self._items_per_page, offset=pager['offset'])
        request.session['my_orders_history'] = orders.ids[:100]

        values.update({
            'date': date_begin,
            'orders': orders.sudo(),
            'page_name': 'order',
            'pager': pager,
            'archive_groups': archive_groups,
            'default_url': '/my/orders',
            'searchbar_sortings': searchbar_sortings,
            'sortby': sortby,
        })
        return request.render("sale.portal_my_orders", values)

    @http.route(['/my/invoices', '/my/invoices/page/<int:page>'], type='http', auth="user", website=True)
    def portal_my_invoices(self, page=1, date_begin=None, date_end=None, sortby=None, **kw):
        values = self._prepare_portal_layout_values()
        AccountInvoice = request.env['account.invoice']
        partner = request.env.user.partner_id
        domain = [('partner_id', '=', partner.id)]

        searchbar_sortings = {
            'date': {'label': _('Invoice Date'), 'order': 'date_invoice desc'},
            'duedate': {'label': _('Due Date'), 'order': 'date_due desc'},
            'name': {'label': _('Reference'), 'order': 'name desc'},
            'state': {'label': _('Status'), 'order': 'state'},
        }
        # default sort by order
        if not sortby:
            sortby = 'date'
        order = searchbar_sortings[sortby]['order']

        archive_groups = self._get_archive_groups('account.invoice', domain)
        if date_begin and date_end:
            domain += [('create_date', '>', date_begin), ('create_date', '<=', date_end)]

        # count for pager
        invoice_count = AccountInvoice.sudo().search_count(domain)
        # pager
        pager = portal_pager(
            url="/my/invoices",
            url_args={'date_begin': date_begin, 'date_end': date_end, 'sortby': sortby},
            total=invoice_count,
            page=page,
            step=self._items_per_page
        )
        # content according to pager and archive selected
        invoices = AccountInvoice.sudo().search(domain, order=order, limit=self._items_per_page, offset=pager['offset'])
        request.session['my_invoices_history'] = invoices.ids[:100]

        values.update({
            'date': date_begin,
            'invoices': invoices,
            'page_name': 'invoice',
            'pager': pager,
            'archive_groups': archive_groups,
            'default_url': '/my/invoices',
            'searchbar_sortings': searchbar_sortings,
            'sortby': sortby,
        })
        return request.render("account.portal_my_invoices", values)

#===============================================================================
#     @http.route(['/my/orders', '/my/orders/page/<int:page>'], type='http', auth="user", website=True)
#     def portal_my_orders(self, page=1, date_begin=None, date_end=None, sortby=None, **kw):
#         values = self._prepare_portal_layout_values()
#         partner = request.env.user.partner_id
#         SaleOrder = request.env['sale.order']
# 
#         domain = [
#             ('message_partner_ids', 'child_of', [partner.commercial_partner_id.id]),
#             ('state', 'in', ['sale', 'done', 'preparing', 'ready', 'delivered'])
#         ]
# 
#         searchbar_sortings = {
#             'date': {'label': _('Order Date'), 'order': 'date_order desc'},
#             'name': {'label': _('Reference'), 'order': 'name'},
#             'stage': {'label': _('Stage'), 'order': 'state'},
#         }
#         # default sortby order
#         if not sortby:
#             sortby = 'date'
#         sort_order = searchbar_sortings[sortby]['order']
# 
#         archive_groups = self._get_archive_groups('sale.order', domain)
#         if date_begin and date_end:
#             domain += [('create_date', '>', date_begin), ('create_date', '<=', date_end)]
# 
#         # count for pager
#         order_count = SaleOrder.search_count(domain)
#         # pager
#         pager = portal_pager(
#             url="/my/orders",
#             url_args={'date_begin': date_begin, 'date_end': date_end, 'sortby': sortby},
#             total=order_count,
#             page=page,
#             step=self._items_per_page
#         )
#         # content according to pager and archive selected
#         orders = SaleOrder.search(domain, order=sort_order, limit=self._items_per_page, offset=pager['offset'])
#         request.session['my_orders_history'] = orders.ids[:100]
# 
#         values.update({
#             'date': date_begin,
#             'orders': orders.sudo(),
#             'page_name': 'order',
#             'pager': pager,
#             'archive_groups': archive_groups,
#             'default_url': '/my/orders',
#             'searchbar_sortings': searchbar_sortings,
#             'sortby': sortby,
#         })
#         return request.render("sale.portal_my_orders", values)
#===============================================================================


class ShopWebsiteSale(ProductConfiguratorController):

    @http.route(['/shop/cart/update'], type='http', auth="public", methods=['POST'], website=True, csrf=False)
    def cart_update(self, product_id, add_qty=1, set_qty=0, **kw):
        product_custom_attribute_values = None
        if kw.get('product_custom_attribute_values'):
            product_custom_attribute_values = json.loads(kw.get('product_custom_attribute_values'))

        request.website.sale_get_order(force_create=1)._cart_update(
            product_id=int(product_id),
            add_qty=add_qty,
            set_qty=set_qty,
            product_custom_attribute_values=product_custom_attribute_values
        )
        return request.redirect("/shop")

    @http.route(['/shop/product/cart/update'], type='json', auth="public", methods=['POST'], website=True, csrf=False)
    def shop_cart_update(self, product_id, price, qty):
        product_tmpl = request.env['product.template'].sudo().search([
            ('id', '=', int(product_id))])
        product = request.env['product.product'].sudo().search([
            ('product_tmpl_id', '=', int(product_id))], limit=1)
        if(product_tmpl.attribute_line_ids):
            return "attribute"
        else:
            request.website.sale_get_order(force_create=1)._cart_update(
                product_id=int(product.id),
                add_qty=qty,
                set_qty=0,
                product_custom_attribute_values=[]
            )
            order = request.website.sale_get_order()
            return "quantity"+str(order.cart_quantity)

    @http.route(['/shop/cart/confirm'], type='json', auth="public", methods=['POST'], website=True, csrf=False)
    def shop_cart_confirm(self, **post):
        order = request.website.sale_get_order()
        if order.partner_id.id == request.website.user_id.sudo().partner_id.id:
            return 'address'
        sorder = request.website.sale_get_order(force_create=1)
        shippings = []
        if sorder.partner_id != request.website.user_id.sudo().partner_id:
            Partner = sorder.partner_id.with_context(show_address=1).sudo()
            shippings = Partner.search([
                ("id", "child_of", sorder.partner_id.commercial_partner_id.ids),
                '|', ("type", "in", ["delivery", "other"]), ("id", "=", sorder.partner_id.commercial_partner_id.id)
            ], order='id desc')
            if shippings:
                if post.get('partner_id') or 'use_billing' in post:
                    if 'use_billing' in post:
                        partner_id = sorder.partner_id.id
                    else:
                        partner_id = int(post.get('partner_id'))
                    if partner_id in shippings.mapped('id'):
                        sorder.partner_shipping_id = partner_id
                elif not sorder.partner_shipping_id:
                    last_order = request.env['sale.order'].sudo().search([("partner_id", "=", sorder.partner_id.id)], sorder='id desc', limit=1)
                    sorder.partner_shipping_id.id = last_order and last_order.id

        order.onchange_partner_shipping_id()
        order.order_line._compute_tax_id()
        request.session['sale_last_order_id'] = order.id
        request.website.sale_get_order(update_pricelist=True)
        order.write({'state': 'sent'})
        request.website.sale_reset()
        return order.id

    @http.route(['/website/show_optional_products_shop_website'], type='json', auth="public", methods=['POST'], website=True)
    def show_optional_products_shop_website(self, product_id, quantity, **kw):
        product = request.env['product.template'].sudo().search([
            ('id', '=', int(product_id))])
        product_context = dict(request.env.context,
                               active_id=product.id,
                               partner=request.env.user.partner_id)
        ProductCategory = request.env['product.public.category']
        category = ""
        if category:
            category = ProductCategory.browse(int(category)).exists()

        attrib_list = request.httprequest.args.getlist('attrib')
        attrib_values = [[int(x) for x in v.split("-")] for v in attrib_list if v]
        attrib_set = {v[1] for v in attrib_values}

        keep = QueryURL('/shop', category=category and category.id, search="", attrib=attrib_list)

        categs = ProductCategory.search([('parent_id', '=', False)])

        pricelist = request.website.get_current_pricelist()

        from_currency = request.env.user.company_id.currency_id
        to_currency = pricelist.currency_id
        compute_currency = lambda price: from_currency._convert(price, to_currency, request.env.user.company_id, fields.Date.today())

        if not product_context.get('pricelist'):
            product_context['pricelist'] = pricelist.id
            product = product.with_context(product_context)
        return request.env['ir.ui.view'].render_template("skit_website_wet_market.optional_products_modal_test", {
            'search': "",
            'category': category,
            'pricelist': pricelist,
            'attrib_values': attrib_values,
            'compute_currency': compute_currency,
            'attrib_set': attrib_set,
            'keep': keep,
            'categories': categs,
            'main_object': product,
            'product': product,
            'quantity': quantity,
            'optional_product_ids': [p.with_context({'active_id': p.id}) for p in product.optional_product_ids],
            'get_attribute_exclusions': self._get_attribute_exclusions,
            })

    @http.route(['/shop/confirm_order'], type='http', auth="public", website=True)
    def confirm_order(self, **post):
        order = request.website.sale_get_order()
 
        redirection = self.checkout_redirection(order)
        if redirection:
            return redirection
 
        order.onchange_partner_shipping_id()
        order.order_line._compute_tax_id()
        request.session['sale_last_order_id'] = order.id
        request.website.sale_get_order(update_pricelist=True)
        extra_step = request.env.ref('website_sale.extra_info_option')
        print(order.partner_id.signup_url)
        if(request.session.get('customer_url')):
            order.write({'state': 'sent'})
            request.website.sale_reset()
            return request.redirect("/web/login?customer=true")#"/my/orders/"+str(order.id))
        if extra_step.active:
            return request.redirect("/shop/confirm_order")
 
        return request.redirect("/shop/payment")


class Home(http.Controller):

    @http.route('/web/login', type='http', auth="none", sitemap=False)
    def web_login(self, redirect=None, **kw):
        ensure_db()
        request.params['login_success'] = False
        if(request.params.get('login')):
            request.params['password'] = request.params['login']
            request.params['confirm_password'] = request.params['login']
        if request.httprequest.method == 'GET' and redirect and request.session.uid:
            return http.redirect_with_hash(redirect)

        if not request.uid:
            request.uid = odoo.SUPERUSER_ID

        values = request.params.copy()
        try:
            values['databases'] = http.db_list()
        except odoo.exceptions.AccessDenied:
            values['databases'] = None

        if request.httprequest.method == 'POST':
            old_uid = request.uid
            try:
                uid = request.session.authenticate(request.session.db, request.params['login'], request.params['password'])
                request.params['login_success'] = True
                return http.redirect_with_hash(self._login_redirect(uid, redirect=redirect))
            except odoo.exceptions.AccessDenied as e:
                request.uid = old_uid
                if e.args == odoo.exceptions.AccessDenied().args:
                    values['error'] = _("Wrong login/password")
                else:
                    values['error'] = e.args[0]
        else:
            if 'error' in request.params and request.params.get('error') == 'access':
                values['error'] = _('Only employee can access this database. Please contact the administrator.')

        if 'login' not in values and request.session.get('auth_login'):
            values['login'] = request.session.get('auth_login')

        if not odoo.tools.config['list_db']:
            values['disable_database_manager'] = True

        # otherwise no real way to test debug mode in template as ?debug =>
        # values['debug'] = '' but that's also the fallback value when
        # missing variables in qweb
        if 'debug' in values:
            values['debug'] = True

        response = request.render('web.login', values)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

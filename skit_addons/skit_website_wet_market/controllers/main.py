
from odoo import fields, http, _
from odoo.exceptions import AccessError, MissingError
from odoo.http import request
from odoo.addons.portal.controllers.portal import CustomerPortal, pager as portal_pager, get_records_pager
from werkzeug.exceptions import Forbidden, NotFound
from odoo.addons.website.controllers.main import QueryURL
from odoo.addons.sale.controllers.product_configurator import ProductConfiguratorController


class CustomerPortal(CustomerPortal):

    @http.route(['/sorder/<int:order_id>'], type='json', auth="public", website=True)
    def update_order_status(self, order_id=None,  **post):
        sale_order = request.env['sale.order'].search([('id', '=', order_id)])
        return sale_order.state


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
        product = request.env['product.template'].sudo().search([
            ('id', '=', int(product_id))])
        if(product.attribute_line_ids):
            print('TEST')
            return "attribute"
        else:
            request.website.sale_get_order(force_create=1)._cart_update(
                product_id=int(product_id),
                add_qty=qty,
                set_qty=0,
                product_custom_attribute_values=[]
            )
            order = request.website.sale_get_order()
            return "quantity"+str(order.cart_quantity)

    @http.route(['/shop/cart/confirm'], type='json', auth="public", methods=['POST'], website=True, csrf=False)
    def shop_cart_confirm(self, **post):
        order = request.website.sale_get_order()
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

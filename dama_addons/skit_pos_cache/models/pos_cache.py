# -*- coding: utf-8 -*-
from odoo import api, models, fields
import base64
import json


class POSCacheData(models.Model):
    _name = 'pos.cache.data'
    _description = "POS Synchronization"

    pk_id = fields.Integer(string='Record ID')
    model_name = fields.Char('Object Name')
    is_create = fields.Boolean('Create', default=False)
    user_id = fields.Integer('User ID')
    is_delete = fields.Boolean('Delete', default=False)
    product_id = fields.Integer(string='Product ID')
    applied = fields.Char('Applied On')
    product_tmpl_id = fields.Many2one('product.template',string="Product Template")
    categ_id = fields.Many2one('product.category',string="Product Category")
    prod_id = fields.Many2one('product.product',string="Product Product")

    @api.model
    def product_cache_data_count(self, user_id):
        cache = self.env['pos.cache.data'].sudo().search_count([
                                    ('model_name', '=', 'product.template'),
                                    ('user_id', '=', user_id)])
        return cache

    @api.model
    def partner_cache_data_count(self, user_id):
        cache = self.env['pos.cache.data'].sudo().search_count([
                                    ('model_name', '=', 'res.partner'),
                                    ('user_id', '=', user_id)])
        return cache

    @api.model
    def pricelist_cache_data_count(self, user_id):
        cache = self.env['pos.cache.data'].sudo().search_count([
                                    ('model_name', '=', 'product.pricelist.item'),
                                    ('user_id', '=', user_id)])
        return cache

    @api.model
    def clear_product_datas(self, user_id):
        cache_datas = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'product.template'),
                                    ('user_id', '=', user_id)])
        cache_datas.unlink()
        return True

    @api.model
    def clear_partner_datas(self, user_id):
        cache_datas = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'res.partner'),
                                    ('user_id', '=', user_id)])
        cache_datas.unlink()
        return True

    @api.model
    def clear_pricelist_datas(self, user_id):
        cache_datas = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'product.pricelist.item'),
                                    ('user_id', '=', user_id)])
        cache_datas.unlink()
        return True

    @api.model
    def get_product_cache_data(self, user_id, config_id):
        cache_data = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'product.template'),
                                    ('user_id', '=', user_id)])
        prod_datas = []
        for cache in cache_data:
            taxes_id = []
            pos_categ = []
            prod_temp = self.env['product.template'].sudo().search([
                                                    ('id', '=', cache.pk_id)])
            prod_prod = self.env['product.product'].sudo().search([
                                    ('product_tmpl_id', '=', prod_temp.id)], limit=1)
            pos_cache = self.env['pos.cache'].search([
                                    ('config_id', '=', config_id)], limit=1)
            prod_ctx = prod_prod.with_context(
                pricelist=pos_cache.config_id.pricelist_id.id,
                display_default_code=False,
                lang=pos_cache.compute_user_id.lang)
            for tax in prod_temp.taxes_id:
                taxes_id.append(tax.id)
            for categ in prod_temp.pos_categ_id:
                pos_categ = [categ.id, categ.name]
            if(cache.is_delete):
                prod_datas.append({"id": cache.pk_id,
                                   "product_id": cache.product_id,
                                   "is_create": cache.is_create,
                                  "is_delete": cache.is_delete})
            for prod in prod_ctx:
                prod_datas.append({
                                "tracking": prod_temp.tracking,
                                "list_price": prod_temp.list_price,
                                "description": prod_temp.description,
                                "uom_id": [prod_temp.uom_id.id,
                                           prod_temp.uom_id.name],
                                "description_sale": prod_temp.description_sale,
                                "barcode": prod_temp.barcode,
                                "product_tmpl_id": [prod_temp.id,
                                                    prod_temp.name],
                                "pos_categ_id": pos_categ,
                                "lst_price": prod_temp.lst_price,
                                "default_code": prod_temp.default_code,
                                "to_weight": prod_temp.to_weight,
                                "standard_price": prod_temp.standard_price,
                                "display_name": prod_temp.display_name,
                                "categ_id": [prod_temp.categ_id.id,
                                             prod_temp.categ_id.name],
                                "id": prod_prod.id or cache.pk_id,
                                "taxes_id": taxes_id,
                                "is_create": cache.is_create,
                                "available_in_pos": prod_prod.available_in_pos,
                                "is_delete": cache.is_delete
                                })
        result = {'products': prod_datas}
        return result

    @api.model
    def get_partner_cache_data(self, user_id):
        cache_data = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'res.partner'),
                                    ('user_id', '=', user_id)])
        partner_datas = []
        for cache in cache_data:
            res_partner = self.env['res.partner'].sudo().search([
                                                    ('id', '=', cache.pk_id)])
            street = ''
            zip_code = ''
            city = ''
            country = ''
            country_id = []
            if res_partner.street:
                street = res_partner.street
            if res_partner.zip:
                zip_code = res_partner.zip
            if res_partner.city:
                city = res_partner.city
            if res_partner.country_id:
                country_id = [res_partner.country_id.id,
                              res_partner.country_id.name]
                country = res_partner.country_id.name
            address = street+", "+zip_code+" "+city+", "+country
            partner_datas.append({
                "city": res_partner.city,
                "name": res_partner.name,
                "zip": res_partner.zip,
                "property_account_position_id":
                res_partner.property_account_position_id.id or False,
                "mobile": res_partner.mobile,
                "barcode": res_partner.barcode,
                "country_id": country_id,
                "email": res_partner.email,
                "phone": res_partner.phone,
                "street": res_partner.street,
                "write_date": res_partner.write_date,
                "state_id": res_partner.state_id.id or False,
                "id": res_partner.id or cache.pk_id,
                "vat": res_partner.vat,
                "address": address,
                "property_product_pricelist":
                [res_partner.property_product_pricelist.id,
                 res_partner.property_product_pricelist.display_name],
                "is_create": cache.is_create,
                "is_delete": cache.is_delete
            })
        result = {'partners': partner_datas}
        return result

    @api.model
    def get_pricelist_cache_data(self, user_id, config_id):
        cache_data = self.env['pos.cache.data'].sudo().search([
                                    ('model_name', '=', 'product.pricelist.item'),
                                    ('user_id', '=', user_id)])
        pricelist_datas = []
        product_datas = []
        applied = ''
        categ_id = 0
        product_tmpl_id = 0
        product_id = 0
        for cache in cache_data:
            #===================================================================
            # pricelist_datas.append(cache.pk_id)
            # prod_pricelist = self.env['product.pricelist'].sudo().search([
            #                                         ('id', '=', cache.pk_id)])
            #===================================================================
            pricelist_item = self.env['product.pricelist.item'].sudo().search([
                            ('id', '=', cache.pk_id)],
                                        order="applied_on desc", limit=1)
            pricelist_datas.append({
                            "product_tmpl_id":[pricelist_item.product_tmpl_id.id,pricelist_item.product_tmpl_id.name],
                            "fixed_price":pricelist_item.fixed_price,
                            "product_id":pricelist_item.product_id.id,
                            "applied_on":pricelist_item.applied_on,
                            "id":pricelist_item.id,
                        })
            applied = pricelist_item.applied_on or cache.applied
            categ_id = pricelist_item.categ_id or cache.categ_id
            product_tmpl_id = pricelist_item.product_tmpl_id or cache.product_tmpl_id
            product_id = pricelist_item.product_id or cache.prod_id
        if applied == '3_global':
            prod_prod = self.env['product.product'].sudo().search(
                        [('product_tmpl_id.available_in_pos', '=', True)])
            pos_cache = self.env['pos.product.pricelist'].search([('config_id', '=',config_id)], limit=1)
            prod_ctx = prod_prod.with_context(
                        pricelist=pos_cache.config_id.pricelist_id.id,
                        display_default_code=False,
                        lang=pos_cache.compute_user_id.lang)
            for prod in prod_ctx:
                taxes_id = []
                for tax in prod.product_tmpl_id.taxes_id:
                    taxes_id.append(tax.id)
                product_datas.append({
                    "tracking": prod.product_tmpl_id.tracking,
                    "list_price": prod.product_tmpl_id.list_price,
                    "description": prod.product_tmpl_id.description,
                    "uom_id": [prod.product_tmpl_id.uom_id.id,
                               prod.product_tmpl_id.uom_id.name],
                    "description_sale": prod.product_tmpl_id.description_sale,
                    "barcode": prod.product_tmpl_id.barcode,
                    "product_tmpl_id": prod.product_tmpl_id.id,
                    "pos_categ_id": prod.product_tmpl_id.pos_categ_id.id or
                    False,
                    "lst_price": prod.product_tmpl_id.lst_price,
                    "default_code": prod.product_tmpl_id.default_code,
                    "to_weight": prod.product_tmpl_id.to_weight,
                    "standard_price": prod.product_tmpl_id.standard_price,
                    "display_name": prod.display_name,
                    "categ_id": [prod.product_tmpl_id.categ_id.id,
                                 prod.product_tmpl_id.categ_id.name],
                    "id": prod.id,
                    "taxes_id": taxes_id,
                    "is_create": cache.is_create,
                    "is_delete": cache.is_delete
                    })
        if applied == '2_product_category':
            prod_prod = self.env['product.product'].sudo().search([
                            ('product_tmpl_id.categ_id', '=', categ_id.id),
                            ('product_tmpl_id.available_in_pos', '=', True)])
            pos_cache = self.env['pos.product.pricelist'].search([('config_id', '=',config_id)], limit=1)
            prod_ctx = prod_prod.with_context(
                        pricelist=pos_cache.config_id.pricelist_id.id,
                        display_default_code=False,
                        lang=pos_cache.compute_user_id.lang)
            for prod in prod_ctx:
                taxes_id = []
                for tax in prod.product_tmpl_id.taxes_id:
                    taxes_id.append(tax.id)
                product_datas.append({
                    "tracking": prod.product_tmpl_id.tracking,
                    "list_price": prod.product_tmpl_id.list_price,
                    "description": prod.product_tmpl_id.description,
                    "uom_id": [prod.product_tmpl_id.uom_id.id,
                               prod.product_tmpl_id.uom_id.name],
                    "description_sale": prod.product_tmpl_id.description_sale,
                    "barcode": prod.product_tmpl_id.barcode,
                    "product_tmpl_id": prod.product_tmpl_id.id,
                    "pos_categ_id": prod.product_tmpl_id.pos_categ_id.id or
                    False,
                    "lst_price": prod.product_tmpl_id.lst_price,
                    "default_code": prod.product_tmpl_id.default_code,
                    "to_weight": prod.product_tmpl_id.to_weight,
                    "standard_price": prod.product_tmpl_id.standard_price,
                    "display_name": prod.display_name,
                    "categ_id": [prod.product_tmpl_id.categ_id.id,
                                 prod.product_tmpl_id.categ_id.name],
                    "id": prod.id,
                    "taxes_id": taxes_id,
                    "is_create": cache.is_create,
                    "is_delete": cache.is_delete
                })
        if applied == '1_product':
            prod_prod = self.env['product.product'].sudo().search([
                            ('product_tmpl_id', '=', product_tmpl_id.id),
                            ('product_tmpl_id.available_in_pos', '=', True)])
            pos_cache = self.env['pos.product.pricelist'].search([('config_id', '=',config_id)], limit=1)
            prod_ctx = prod_prod.with_context(
                        pricelist=pos_cache.config_id.pricelist_id.id,
                        display_default_code=False,
                        lang=pos_cache.compute_user_id.lang)
            for prod in prod_ctx:
                taxes_id = []
                for tax in prod.product_tmpl_id.taxes_id:
                    taxes_id.append(tax.id)
                product_datas.append({
                    "tracking": prod.product_tmpl_id.tracking,
                    "list_price": prod.product_tmpl_id.list_price,
                    "description": prod.product_tmpl_id.description,
                    "uom_id": [prod.product_tmpl_id.uom_id.id,
                               prod.product_tmpl_id.uom_id.name],
                    "description_sale": prod.product_tmpl_id.description_sale,
                    "barcode": prod.product_tmpl_id.barcode,
                    "product_tmpl_id": prod.product_tmpl_id.id,
                    "pos_categ_id": prod.product_tmpl_id.pos_categ_id.id or
                    False,
                    "lst_price": prod.product_tmpl_id.lst_price,
                    "default_code": prod.product_tmpl_id.default_code,
                    "to_weight": prod.product_tmpl_id.to_weight,
                    "standard_price": prod.product_tmpl_id.standard_price,
                    "display_name": prod.display_name,
                    "categ_id": [prod.product_tmpl_id.categ_id.id,
                                 prod.product_tmpl_id.categ_id.name],
                    "id": prod.id,
                    "taxes_id": taxes_id,
                    "is_create": cache.is_create,
                    "is_delete": cache.is_delete
                })
        if applied == '0_product_variant':
            prod_prod = self.env['product.product'].sudo().search([
                            ('id', '=', product_id.id),
                            ('product_tmpl_id.available_in_pos', '=', True)])
            pos_cache = self.env['pos.product.pricelist'].search([('config_id', '=',config_id)], limit=1)
            prod_ctx = prod_prod.with_context(
                        pricelist=pos_cache.config_id.pricelist_id.id,
                        display_default_code=False,
                        lang=pos_cache.compute_user_id.lang)
            for prod in prod_ctx:
                taxes_id = []
                for tax in prod.product_tmpl_id.taxes_id:
                    taxes_id.append(tax.id)
                product_datas.append({
                    "tracking": prod.product_tmpl_id.tracking,
                    "list_price": prod.product_tmpl_id.list_price,
                    "description": prod.product_tmpl_id.description,
                    "uom_id": [prod.product_tmpl_id.uom_id.id,
                               prod.product_tmpl_id.uom_id.name],
                    "description_sale": prod.product_tmpl_id.description_sale,
                    "barcode": prod.product_tmpl_id.barcode,
                    "product_tmpl_id": prod.product_tmpl_id.id,
                    "pos_categ_id": prod.product_tmpl_id.pos_categ_id.id or
                    False,
                    "lst_price": prod.product_tmpl_id.lst_price,
                    "default_code": prod.product_tmpl_id.default_code,
                    "to_weight": prod.product_tmpl_id.to_weight,
                    "standard_price": prod.product_tmpl_id.standard_price,
                    "display_name": prod.display_name,
                    "categ_id": [prod.product_tmpl_id.categ_id.id,
                                 prod.product_tmpl_id.categ_id.name],
                    "id": prod.id,
                    "taxes_id": taxes_id,
                    "is_create": cache.is_create,
                    "is_delete": cache.is_delete
                })
        
        result = {'products': product_datas,
                  'pricelists': pricelist_datas}
        return result


class ProductProduct(models.Model):
    _inherit = "product.product"

    @api.multi
    def unlink(self):
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.product_tmpl_id.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.template')])
        if exit_cache:
            exit_cache.update({'is_delete': True,
                               'product_id': self.id})
        prod_prod = super(ProductProduct, self).unlink()

        return prod_prod


class ProductTemplate(models.Model):
    _inherit = "product.template"

    @api.model
    def create(self, vals):
        prod_template = super(ProductTemplate, self).create(vals)
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', prod_template.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.template')])
        pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
        if exit_cache:
            exit_cache.unlink()
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                                {'pk_id': prod_template.id,
                                 'user_id': session.user_id.id,
                                 'model_name': 'product.template',
                                 'is_create': True})
        else:
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                                {'pk_id': prod_template.id,
                                 'user_id': session.user_id.id,
                                 'model_name': 'product.template',
                                 'is_create': True})
        return prod_template

    @api.multi
    def write(self, vals):
        prod_template = super(ProductTemplate, self).write(vals)
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        is_create = False
        if(vals.get('available_in_pos')):
            is_create = True
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.template')])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'product.template')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'product.template',
                                      'is_create': is_create})
        else:
            if(vals.get('available_in_pos')):
                exit_cache.update({'is_create': is_create})
        return prod_template

    @api.multi
    def unlink(self):
        prod_prod = self.env['product.product'].sudo().search([('product_tmpl_id', '=', self.id)], limit=1)
        prod_template = super(ProductTemplate, self).unlink()
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.template')])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'product.template')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'product.template',
                                      'is_delete': True,
                                      'product_id': prod_prod.id
                                      })
        else:
            exit_cache.update({'is_delete': True,
                               'product_id': prod_prod.id})
        return prod_template


class pos_product(models.Model):
    _inherit = "pos.cache"

    @api.model
    def update_product(self, products, user_id, config_id):
        pos_cache = self.env['pos.cache'].search([
                                ('compute_user_id', '=', user_id),
                                ('config_id', '=', config_id)], limit=1)
        prod_list = self.env['product.product'].search([
                    ('id', 'in', products)], order='name ASC')
        prod_ctx = prod_list.with_context(
                    pricelist=pos_cache.config_id.pricelist_id.id,
                    display_default_code=False,
                    lang=pos_cache.compute_user_id.lang)
        prod = prod_ctx.read(pos_cache.get_product_fields())
        cache = base64.decodestring(pos_cache.cache)
        exit_cache = json.loads(cache.decode('utf-8'))
        tmp_ids = []
        for tmp in prod_list:
            tmp_ids.append(tmp.product_tmpl_id.id)
        delete_prod = self.env['pos.cache.data'].sudo().search([('is_delete', '=', True),
                                                                ('pk_id', 'in', tmp_ids),
                                                                ('user_id', '=', self.env.uid)])

        for product in delete_prod:
            del_prod = self.env['product.product'].sudo().search([
                            ('product_tmpl_id', '=', product.pk_id)], limit=1)
            exit_val = [x for x in exit_cache if x.get('id') == del_prod.id]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                del exit_cache[exit_index]
        if len(prod) <= 0:
            del_prod1 = self.env['pos.cache.data'].sudo().search([('is_delete', '=', True),
                                                    ('pk_id', 'in', products),
                                                    ('user_id', '=', self.env.uid)])
            exit_val = [x for x in exit_cache if x.get('id') == del_prod1.product_id]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                del exit_cache[exit_index]
        for data in prod:
            current_prod = self.env['product.product'].sudo().search([('id', '=', int(data['id']))])
            delete_product = self.env['pos.cache.data'].sudo().search([('is_delete', '=', True),
                                                    ('pk_id', '=', current_prod.product_tmpl_id.id),
                                                    ('user_id', '=', self.env.uid)])
            exit_val = [x for x in exit_cache if x.get('id') == data['id']]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                if(current_prod.available_in_pos and (not delete_product)):
                    exit_cache[exit_index] = data
                else:
                    del exit_cache[exit_index]
            else:
                if(current_prod.available_in_pos and (not delete_product)):
                    exit_cache.append(data)
        datas = {
            'cache': base64.encodestring(
                        json.dumps(exit_cache).encode('utf-8')),
        }
        pos_cache.write(datas)
        """ update cache for exit user """
        exit_pos_cache = self.env['pos.cache'].search([
                                ('config_id', '=', pos_cache.config_id.id)])
        for pcache in exit_pos_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)])
            if not pos_session:
                pcache.write(datas)
        exit_pos_cache1 = self.env['pos.cache'].search([
                                ('config_id', '!=', pos_cache.config_id.id)])
        for pcache in exit_pos_cache1:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)],
                                order='id DESC', limit=1)
            if not pos_session:
                pcache.write(datas)

    @api.model
    def update_product_pricelist(self, products, user_id, config_id, pricelist_ids):
        pos_cache = self.env['pos.cache'].search([
                            ('compute_user_id', '=', user_id),
                            ('config_id', '=', config_id)], limit=1)
        prod_list = self.env['product.product'].search([
                                            ('id', 'in', products)])
        prod_ctx = prod_list.with_context(
                    pricelist=pos_cache.config_id.pricelist_id.id,
                    display_default_code=False,
                    lang=pos_cache.compute_user_id.lang)
        prod = prod_ctx.read(pos_cache.get_product_fields())
        cache = base64.decodestring(pos_cache.cache)
        exit_cache = json.loads(cache.decode('utf-8'))
        for data in prod:
            exit_val = [x for x in exit_cache if x.get('id') == data['id']]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                exit_cache[exit_index] = data
            else:
                exit_cache.append(data)
        datas = {
            'cache': base64.encodestring(
                            json.dumps(exit_cache).encode('utf-8')),
        }
        pos_cache.write(datas)
        """ update cache for exit user """
        exit_pos_cache = self.env['pos.cache'].search([
                                ('config_id', '=', pos_cache.config_id.id)])
        for pcache in exit_pos_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)])
            if not pos_session:
                pcache.write(datas)
        exit_pos_cache1 = self.env['pos.cache'].search([
                                ('config_id', '!=', pos_cache.config_id.id)])
        for pcache in exit_pos_cache1:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)],
                                order='id DESC', limit=1)
            if not pos_session:
                pcache.write(datas)

        """ Update PriceList Cache"""
        pos_pricelist_cache = self.env['pos.product.pricelist'].search([
                            ('compute_user_id', '=', user_id),
                            ('config_id', '=', config_id)], limit=1)
        prod_pricelist = self.env['product.pricelist.item'].search([
                                            ('id', 'in', pricelist_ids)])
        prod_list_ctx = prod_pricelist.with_context(
                    pricelist=pos_pricelist_cache.config_id.pricelist_id.id,
                    display_default_code=False,
                    lang=pos_pricelist_cache.compute_user_id.lang)
        prod_pricelist = prod_list_ctx.read(pos_pricelist_cache.get_pricelist_fields())
        cache = base64.decodestring(pos_pricelist_cache.cache)
        exit_price_cache = json.loads(cache.decode('utf-8'))
        for data in prod_pricelist:
            exit_val = [x for x in exit_price_cache if x.get('id') == data['id']]
            if len(exit_val) > 0:
                exit_index = exit_price_cache.index(exit_val[0])
                exit_price_cache[exit_index] = data
            else:
                exit_price_cache.append(data)
        datas = {
            'cache': base64.encodestring(
                            json.dumps(exit_price_cache).encode('utf-8')),
        }
        pos_pricelist_cache.write(datas)

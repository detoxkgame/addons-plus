# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64
import json
from ast import literal_eval

from odoo import models, fields, api


class pos_res_partner(models.Model):
    _name = 'pos.product.pricelist'

    cache = fields.Binary(attachment=True)
    pricelist_domain = fields.Text(required=True)
    pricelist_fields = fields.Text(required=True)

    config_id = fields.Many2one('pos.config', ondelete='cascade',
                                required=True)
    compute_user_id = fields.Many2one('res.users', 'Cache compute user',
                                      required=True)

    @api.model
    def refresh_all_caches(self):
        self.env['pos.product.pricelist'].search([]).refresh_cache()

    @api.one
    def refresh_cache(self):
        PriceList = self.env['product.pricelist'].sudo(self.compute_user_id.id)
        pricelists = PriceList.search([
                    ('currency_id', 'in',
                     self.config_id.pricelist_id.currency_id.ids)])
        pricelist_ctx = pricelists.with_context(
                        pricelist=self.config_id.pricelist_id.id,
                        display_default_code=False,
                        lang=self.compute_user_id.lang)
        price = pricelist_ctx.read(self.get_pricelist_fields())
        datas = {
            'cache': base64.encodestring(json.dumps(price).encode('utf-8')),
        }

        self.write(datas)

    @api.model
    def get_pricelist_domain(self):
        return literal_eval(self.pricelist_domain)

    @api.model
    def get_pricelist_fields(self):
        return literal_eval(self.pricelist_fields)

    @api.model
    def get_cache(self, domain, fields):
        if not ((self.cache) or (domain != self.get_pricelist_domain()) or
                (fields != self.get_pricelist_fields())):
            self.pricelist_domain = str(domain)
            self.pricelist_fields = str(fields)
            self.refresh_cache()

        return json.loads(base64.decodestring(self.cache).decode('utf-8'))


class pos_config(models.Model):
    _inherit = 'pos.config'

    @api.one
    @api.depends('pricelist_cache_ids')
    def _get_oldest_pricelistcache_time(self):
        pos_cache = self.env['pos.product.pricelist']
        oldest_cache = pos_cache.search([('config_id', '=', self.id)],
                                        order='write_date', limit=1)
        if oldest_cache:
            self.oldest_cache_time_pricelist = oldest_cache.write_date

    # Use a related model to avoid the load
    # of the cache when the pos load his config
    pricelist_cache_ids = fields.One2many('pos.product.pricelist', 'config_id')
    oldest_cache_time_pricelist = fields.Datetime(
                    compute='_get_oldest_pricelistcache_time',
                    string='Oldest pricelist cache time', readonly=True)

    def _get_pricelistcache_for_user(self):
        pos_cache = self.env['pos.product.pricelist']
        cache_for_user = pos_cache.search([
                    ('id', 'in', self.pricelist_cache_ids.ids),
                    ('compute_user_id', '=', self.env.uid)])

        if cache_for_user:
            return cache_for_user[0]
        else:
            return None

    @api.multi
    def get_pricelists_from_cache(self, fields, domain):
        cache_for_user = self._get_pricelistcache_for_user()

        if cache_for_user:
            return cache_for_user.get_cache(domain, fields)
        else:
            pos_cache = self.env['pos.product.pricelist']
            pos_cache.create({
                'config_id': self.id,
                'pricelist_domain': str(domain),
                'pricelist_fields': str(fields),
                'compute_user_id': self.env.uid
            })
            new_cache = self._get_pricelistcache_for_user()
            return new_cache.get_cache(domain, fields)

    @api.one
    def delete_pricelist_cache(self):
        # throw away the old caches
        self.pricelist_cache_ids.unlink()


class Product_PriceListItem(models.Model):
    _inherit = "product.pricelist.item"

    @api.model
    def create(self, vals):
        pricelist = super(Product_PriceListItem, self).create(vals)
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', pricelist.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.pricelist.item')])
        pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
        if exit_cache:
            exit_cache.unlink()
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                                {'pk_id': pricelist.id,
                                 'user_id': session.user_id.id,
                                 'model_name': 'product.pricelist.item',
                                 'is_create': True})
        else:
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                                {'pk_id': pricelist.id,
                                 'user_id': session.user_id.id,
                                 'model_name': 'product.pricelist.item',
                                 'is_create': True})
        return pricelist

    @api.multi
    def write(self, vals):
        pricelist = super(Product_PriceListItem, self).write(vals)
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.pricelist.item')])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'product.pricelist.item')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'product.pricelist.item'})
        return pricelist

    @api.multi
    def unlink(self):
        plist = self.env['product.pricelist.item'].sudo().search([('id', '=', self.id)])
        applied_on = plist.applied_on
        categ_id = plist.categ_id.id
        product_tmpl_id = plist.product_tmpl_id.id
        product_id = plist.product_id.id
        pricelist = super(Product_PriceListItem, self).unlink()
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'product.pricelist.item')])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'product.pricelist.item')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'product.pricelist.item',
                                      'is_delete': True,
                                      'applied': applied_on,
                                      'categ_id': categ_id,
                                      'product_tmpl_id': product_tmpl_id,
                                      'prod_id': product_id})
        else:
            exit_cache.update({'is_delete': True,
                               'applied': applied_on,
                               'categ_id': categ_id,
                               'product_tmpl_id': product_tmpl_id,
                               'prod_id': product_id})
        return pricelist

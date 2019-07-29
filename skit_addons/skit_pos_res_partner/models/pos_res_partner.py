# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import base64
import json
from ast import literal_eval
from odoo import models, fields, api


class pos_res_partner(models.Model):
    _name = 'pos.res.partner'

    cache = fields.Binary(attachment=True)
    partner_domain = fields.Text(required=True)
    partner_fields = fields.Text(required=True)

    config_id = fields.Many2one('pos.config', ondelete='cascade',
                                required=True)
    compute_user_id = fields.Many2one('res.users', 'Cache compute user',
                                      required=True)

    @api.model
    def refresh_all_caches(self):
        self.env['pos.res.partner'].search([]).refresh_cache()

    @api.one
    def refresh_cache(self):
        Partner = self.env['res.partner'].sudo(self.compute_user_id.id)
        partners = Partner.search(self.get_partner_domain())
        partner_ctx = partners.with_context(
                pricelist=self.config_id.pricelist_id.id,
                display_default_code=False,
                lang=self.compute_user_id.lang)
        res = partner_ctx.read(self.get_partner_fields())
        for cust in res:
            cust['write_date'] = str(cust['write_date'])
        datas = {
            'cache': base64.encodestring(json.dumps(res).encode('utf-8')),
        }

        self.write(datas)

    @api.model
    def get_partner_domain(self):
        return literal_eval(self.partner_domain)

    @api.model
    def get_partner_fields(self):
        return literal_eval(self.partner_fields)

    @api.model
    def get_cache(self, domain, fields):
        if not ((self.cache) or (domain != self.get_partner_domain()) or
                (fields != self.get_partner_fields())):
            self.partner_domain = str(domain)
            self.partner_fields = str(fields)
            self.refresh_cache()

        return json.loads(base64.decodestring(self.cache).decode('utf-8'))

    @api.model
    def update_partner(self, partners, user_id):
        pos_cache_partner = self.env['pos.res.partner'].search([
                                        ('compute_user_id', '=', user_id)],
                                        order='id DESC',
                                        limit=1)
        res_ctx = self.env['res.partner'].search([('id', 'in', partners)])
        res = res_ctx.read(pos_cache_partner.get_partner_fields())
        cache = base64.decodestring(pos_cache_partner.cache)
        exit_cache = json.loads(cache.decode('utf-8'))
        delete_partner = self.env['pos.cache.data'].sudo().search([('is_delete', '=', True), ('pk_id', 'in', partners)])
        for partner in delete_partner:
            exit_val = [x for x in exit_cache if x.get('id') == partner.pk_id]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                del exit_cache[exit_index]
        for data in res:
            exit_val = [x for x in exit_cache if x.get('id') == data['id']]
            if len(exit_val) > 0:
                exit_index = exit_cache.index(exit_val[0])
                exit_cache[exit_index] = data
            else:
                exit_cache.append(data)
        for cust in exit_cache:
            cust['write_date'] = str(cust['write_date'])
        datas = {
            'cache': base64.encodestring(
                        json.dumps(exit_cache).encode('utf-8')),
        }
        pos_cache_partner.write(datas)
        """ update cache for exit user """
        exit_pos_cache_partner = self.env['pos.cache'].search([
                        ('config_id', '=', pos_cache_partner.config_id.id)])
        for pcache in exit_pos_cache_partner:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)])
            if not pos_session:
                pcache.write(datas)
        exit_pos_cache_partner1 = self.env['pos.cache'].search([
                        ('config_id', '!=', pos_cache_partner.config_id.id)])
        for pcache in exit_pos_cache_partner1:
            pos_session = self.env['pos.session'].sudo().search([
                                ('state', '=', 'opened'),
                                ('config_id', '=', pcache.config_id.id),
                                ('user_id', '=', pcache.compute_user_id.id)],
                                order='id DESC', limit=1)
            if not pos_session:
                pcache.write(datas)


class pos_config(models.Model):
    _inherit = 'pos.config'

    @api.one
    @api.depends('partner_cache_ids')
    def _get_oldest_partnercache_time(self):
        pos_cache = self.env['pos.res.partner']
        oldest_cache = pos_cache.search([('config_id', '=', self.id)],
                                        order='write_date', limit=1)
        if oldest_cache:
            self.oldest_cache_time_respartner = oldest_cache.write_date

    # Use a related model to avoid the load of the
    # cache when the pos load his config
    partner_cache_ids = fields.One2many('pos.res.partner', 'config_id')
    oldest_cache_time_respartner = fields.Datetime(
                        compute='_get_oldest_partnercache_time',
                        string='Oldest partner cache time', readonly=True)

    def _get_partnercache_for_user(self):
        pos_cache = self.env['pos.res.partner']
        cache_for_user = pos_cache.search([
                    ('id', 'in', self.partner_cache_ids.ids),
                    ('compute_user_id', '=', self.env.uid)])

        if cache_for_user:
            return cache_for_user[0]
        else:
            return None

    @api.multi
    def get_partners_from_cache(self, fields, domain):
        cache_for_user = self._get_partnercache_for_user()

        if cache_for_user:
            return cache_for_user.get_cache(domain, fields)
        else:
            pos_cache = self.env['pos.res.partner']
            pos_cache.create({
                'config_id': self.id,
                'partner_domain': str(domain),
                'partner_fields': str(fields),
                'compute_user_id': self.env.uid
            })
            new_cache = self._get_partnercache_for_user()
            return new_cache.get_cache(domain, fields)

    @api.one
    def delete_partner_cache(self):
        # throw away the old caches
        self.partner_cache_ids.unlink()


class Partner(models.Model):
    _inherit = "res.partner"

    @api.model
    def create(self, vals):
        res_partner = super(Partner, self).create(vals)
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', res_partner.id),
                        ('user_id', '=', user_id)])
        pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
        if(exit_cache):
            exit_cache.unlink()
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                        {'pk_id': res_partner.id,
                         'user_id': session.user_id.id,
                         'model_name': 'res.partner',
                         'is_create': True})
        else:
            for session in pos_session:
                self.env['pos.cache.data'].sudo().create(
                        {'pk_id': res_partner.id,
                         'user_id': session.user_id.id,
                         'model_name': 'res.partner',
                         'is_create': True})
        return res_partner

    @api.multi
    def write(self, vals):
        res_partner = super(Partner, self).write(vals)
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id)])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'res.partner')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'res.partner'})
        return res_partner

    @api.multi
    def unlink(self):
        res_partner = super(Partner, self).unlink()
        pos_cache = self.env['pos.cache.data']
        user_id = self.env.uid
        exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', user_id),
                        ('model_name', '=', 'res.partner')])
        if not exit_cache:
            pos_session = self.env['pos.session'].sudo().search([
                                                ('state', '=', 'opened')])
            for session in pos_session:
                session_exit_cache = self.env['pos.cache.data'].sudo().search([
                        ('pk_id', '=', self.id),
                        ('user_id', '=', session.user_id.id),
                        ('model_name', '=', 'res.partner')])
                if not session_exit_cache:
                    pos_cache.create({'pk_id': self.id,
                                      'user_id': session.user_id.id,
                                      'model_name': 'res.partner',
                                      'is_delete': True})
        else:
            exit_cache.update({'is_delete': True})
        return res_partner

# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from lxml import etree

from odoo import api, fields, models, _
from odoo.osv.orm import setup_modifiers



class ResUsers(models.Model):
    _inherit = 'res.users'

    is_standard_cashier = fields.Boolean(string="Standard Cashier")


class pos_session(models.Model):
    _inherit = 'pos.session'

    @api.model
    def fields_view_get(self, view_id=None, view_type='form', toolbar=False, submenu=False):
        result = super(pos_session, self).fields_view_get(view_id, view_type, toolbar=toolbar, submenu=submenu)
        if view_type == 'form' and self.env.user.is_standard_cashier:
            doc = etree.XML(result['arch'])
            # statement ids label/separator
            for node in doc.xpath("//separator"):
                node.set('invisible', "1")
                setup_modifiers(node)
            # statement ids
            if doc.xpath("//field[@name='statement_ids']"):
                node = doc.xpath("//field[@name='statement_ids']")[0]
                node.set('invisible', '1')
                setup_modifiers(node, result['fields']['statement_ids'])
            # cash control -> opening balance and etc
            for node in doc.xpath("//group/div[1]/group[hasclass('oe_subtotal_footer')]"):
                node.set('invisible', "1")
                setup_modifiers(node)
                break
            if doc.xpath("//field[@name='cash_register_difference']"):
                node = doc.xpath("//field[@name='cash_register_difference']")[0]
                node.set('invisible', '1')
                setup_modifiers(node, result['fields']['cash_register_difference'])
            result['arch'] = etree.tostring(doc, encoding='unicode')
        return result

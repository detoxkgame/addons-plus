# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    supplier_view = fields.Boolean(string='Supplier View', default=False)
    cashier_view = fields.Boolean(string='Cashier View', default=False)

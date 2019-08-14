# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    kitchen_state = fields.Selection(
        [('start', 'Start'), ('cooking', 'Cooking'),
         ('delivered', 'Delivered'), ('cancel', 'Cancelled')],
        'Kitchen Status', default='start')

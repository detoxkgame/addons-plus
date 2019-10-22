# -*- coding: utf-8 -*-

from odoo import models, fields


class PosConfig(models.Model):
    _inherit = 'pos.config'

    enable_rounding = fields.Boolean('Enable Rounding')
    rounding_product = fields.Many2one('product.product', 'Rounding Product', domain=[('type', '=', 'service')])


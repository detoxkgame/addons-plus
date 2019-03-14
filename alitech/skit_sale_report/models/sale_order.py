# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.


from odoo import fields, models


class SaleOrder(models.Model):
    _inherit = "sale.order"

    incoterm_location = fields.Char(string="Incoterm Location", size=2)
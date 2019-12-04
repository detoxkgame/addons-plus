# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    expire_date = fields.Date(string='Expire Date')
    wetmarket_company_ids = fields.Many2many('res.company',
                                             string="WetMarket Companies")


class ProductPublicCategory(models.Model):
    _inherit = 'product.public.category'

    wetmarket_company_ids = fields.Many2many('res.company',
                                             string="WetMarket Companies")

# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class PosConfig(models.Model):
    _inherit = 'pos.config'

    is_kitchen = fields.Boolean(string='Kitchen', default=False)
    pos_categ_ids = fields.Many2many('pos.category', string='POS Category')
    other_pos_categ_ids = fields.Many2many('pos.category', string='POS Category',
                                     compute='_compute_pos_category')

    @api.one
    @api.depends('pos_categ_ids')
    def _compute_pos_category(self):
        for config in self:
            config.other_pos_categ_ids = (self.env['pos.config'].search([('id', 'not in', config.ids)]).mapped("pos_categ_ids"))


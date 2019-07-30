# -*- coding: utf-8 -*-
from odoo import api, fields, models


class AccountMove(models.Model):
    """ Inherited account move """
    _inherit = "account.move"

    partner_id = fields.Many2one('res.partner', compute='_compute_partner_value', string="Partner", store=True, readonly=False)
    
    @api.model
    def create(self, vals):
        res = super(AccountMove, self).create(vals)
        for line in res.line_ids:
            line.partner_id = res.partner_id.id
        return res
    
    @api.multi
    def write(self, values):
        res = super(AccountMove, self).write(values)
        for line in self.line_ids:
            line.partner_id = self.partner_id.id
        return res     
    


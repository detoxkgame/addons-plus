# -*- coding: utf-8 -*-

from odoo import fields, models, api, _


class ResPartner(models.Model):
    """ Res Partner """
    _inherit = 'res.partner'
    _description = "Inherit Res Partner"

    code = fields.Char(string='Customer Code', required=False,
                       copy=False, readonly=False, index=True,
                       default=lambda self: _(''))

    @api.model
    def create(self, vals):
        vals['code'] = self.env['ir.sequence'].next_by_code(
                                                'res.partner.code') or 'New'
        partner = super(ResPartner, self).create(vals)
        return partner
